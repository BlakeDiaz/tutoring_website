from flask import Blueprint, request, jsonify, Response
from .database_setup import pool
from psycopg.rows import dict_row
from psycopg.errors import SerializationFailure
from flask_jwt_extended import jwt_required, current_user, get_current_user
from .user import User
import time
import random

TRANSACTION_RETRY_AMOUNT = 3

bp = Blueprint("book", __name__, url_prefix="/api/book")


def generate_confirmation_code():
    return "".join([str(random.randint(0, 9)) for _ in range(6)])


@bp.get("/get_available_appointments")
def get_available_appointments():
    date = request.args.get("date")

    with pool.connection() as conn:
        cur = conn.cursor(row_factory=dict_row)

        cur.execute(
            """
            SELECT ats.appointmentID AS appointment_id, ats.date AS date, ats.hour24 AS hour_24,
                   ats.capacity AS capacity, COUNT(b.userID) AS slots_booked, u.name AS leader_name
            FROM AppointmentTimeSlots ats
            LEFT OUTER JOIN Bookings b
                ON ats.appointmentID = b.appointmentID
            LEFT OUTER JOIN Users u
                ON ats.leaderUserID = u.userID
            WHERE ats.date = %(date)s
            GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity, u.name
            HAVING ats.capacity - COUNT(b.userID) > 0
            ORDER BY ats.hour24 ASC;
            """,
            {"date": date},
        )

        records = cur.fetchall()
        appointments = []
        for record in records:
            leader_name = ""
            if record.get("leader_name") is not None:
                leader_name = record.get("leader_name")

            appointments.append(
                {
                    "appointment_id": record.get("appointment_id"),
                    "date": str(record.get("date")),
                    "hour_24": record.get("hour_24"),
                    "capacity": record.get("capacity"),
                    "slots_booked": record.get("slots_booked"),
                    "leader_name": leader_name,
                }
            )

        return jsonify({"success": True, "appointments": appointments})

    return jsonify({"success": False})


@bp.get("/get_scheduled_appointments")
@jwt_required()
def get_user_appointments():
    with pool.connection() as conn:
        cur = conn.cursor(row_factory=dict_row)

        cur.execute(
            """
            WITH ScheduledAppointments AS (
                SELECT ats.appointmentID AS appointmentID, ats.date AS date, ats.hour24 AS hour24,
                       ats.capacity AS capacity, COUNT(b.userID) AS slotsBooked, ats.leaderUserID AS leaderUserID
                FROM AppointmentTimeSlots ats
                INNER JOIN Bookings b
                    ON ats.appointmentID = b.appointmentID
                GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity
            )
            SELECT sa.appointmentID AS appointment_id, sa.date AS date, sa.hour24 AS hour_24, sa.capacity AS capacity,
                   sa.slotsBooked AS slots_booked, u.name AS leader_name
            FROM ScheduledAppointments sa
            INNER JOIN Bookings b
                ON sa.appointmentID = b.appointmentID
            INNER JOIN Users u
                ON sa.leaderUserID = u.userID
            WHERE b.userID = %(user_id)s
            ORDER BY sa.date ASC, sa.hour24 ASC;
            """,
            {"user_id": current_user.user_id},
        )

        records = cur.fetchall()
        appointments = []
        for record in records:
            appointments.append(
                {
                    "appointment_id": record.get("appointment_id"),
                    "date": str(record.get("date")),
                    "hour_24": record.get("hour_24"),
                    "capacity": record.get("capacity"),
                    "slots_booked": record.get("slots_booked"),
                    "leader_name": record.get("leader_name"),
                }
            )

        return jsonify({"appointments": appointments})

    return jsonify({"message": "Error occured"})


@bp.post("/book_new_appointment")
@jwt_required()
def book_new_appointment():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to book_new_appointment POST request", status=400
        )
    if not "appointment_id" in json:
        return Response(
            response="Appointment ID not present in book_new_appointment POST request",
            status=400,
        )
    if not "subject" in json:
        return Response(
            response="Subject not present in book_new_appointment POST request",
            status=400,
        )
    if not "location" in json:
        return Response(
            response="Location not present in book_new_appointment POST request",
            status=400,
        )
    if not "comments" in json:
        return Response(
            response="Comments not present in book_new_appointment POST request",
            status=400,
        )

    appointment_id: int
    try:
        appointment_id = int(json["appointment_id"])
    except ValueError:
        return Response(
            response="Appointment ID must be an integer in book_appointment POST request",
            status=400,
        )
    subject = json["subject"]
    location = json["location"]
    comments = json["comments"]

    if len(subject) > 512:
        return Response(
            response="Subject length must be at most 512 characters", status=400
        )
    if len(location) > 512:
        return Response(
            response="Location length must be at most 512 characters", status=400
        )
    if len(comments) > 512:
        return Response(
            response="Comments length must be at most 512 characters", status=400
        )

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            with pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                cur.execute(
                    """
                    SELECT COUNT(*) > 0 AS appointment_is_valid
                    FROM AppointmentTimeSlots ats
                    LEFT OUTER JOIN Bookings b
                        ON ats.appointmentID = b.appointmentID
                    WHERE ats.appointmentID = %(appointment_id)s
                      AND b.userID IS NULL;
                    """,
                    {"appointment_id": appointment_id},
                )

                record = cur.fetchone()
                appointment_is_valid = record.get("appointment_is_valid")

                # If a clear appointment can't be found, don't book it
                if not appointment_is_valid:
                    conn.rollback()
                    return Response(
                        message="Appointment does not exist or already has been booked",
                        status=400,
                    )

                # Now that we know there is a clear appointment, book it
                cur.execute(
                    """
                    INSERT INTO Bookings
                    (appointmentID, userID, bookingTimestamp, comments)
                    VALUES
                    (%(appointment_id)s, %(user_id)s, CURRENT_TIMESTAMP, %(comments)s);
                    """,
                    {
                        "appointment_id": appointment_id,
                        "user_id": current_user.user_id,
                        "comments": comments,
                    },
                )

                # Assign the user as the current leader, and set the subject and location
                cur.execute(
                    """
                    UPDATE AppointmentTimeSlots
                    SET leaderUserID = %(leader_user_id)s, confirmationCode = %(confirmation_code)s,
                        subject = %(subject)s, location = %(location)s
                    WHERE appointmentID = %(appointment_id)s;
                    """,
                    {
                        "leader_user_id": current_user.user_id,
                        "confirmation_code": generate_confirmation_code(),
                        "subject": subject,
                        "location": location,
                        "appointment_id": appointment_id,
                    },
                )

                return jsonify(
                    {
                        "message": "Successfully booked appointment",
                    }
                )

        except SerializationFailure:
            tries += 1
            time.sleep(2 * tries)

    return Response(message="Failed to book appointment", status_code=409)


@bp.post("/book_existing_appointment")
@jwt_required()
def book_existing_appointment():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to book_existing_appointment POST request",
            status=400,
        )
    if not "appointment_id" in json:
        return Response(
            response="Appointment ID not present in book_existing_appointment POST request",
            status=400,
        )
    if not "comments" in json:
        return Response(
            response="Comments not present in book_existing_appointment POST request",
            status=400,
        )

    appointment_id: int
    try:
        appointment_id = int(json["appointment_id"])
    except ValueError:
        return Response(
            response="Appointment ID must be an integer in book_appointment POST request",
            status=400,
        )
    comments = json["comments"]
    confirmation_code = json.get("confirmation_code")

    if len(comments) > 512:
        return Response(
            response="Comments length must be at most 512 characters", status=400
        )
    if len(confirmation_code) != 6:
        return Response(
            response="Confirmation code length must be exactly 6 characters", status=400
        )

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            with pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                cur.execute(
                    """
                    SELECT ats.capacity AS capacity, COUNT(b.userID) AS slots_booked,
                           ats.leaderUserID AS leader_user_id, ats.confirmationCode AS confirmation_code
                    FROM AppointmentTimeSlots ats
                    LEFT OUTER JOIN Bookings b
                        ON ats.appointmentID = b.appointmentID
                    WHERE ats.appointmentID = %(appointment_id)s
                    GROUP BY ats.appointmentID, ats.capacity;
                    """,
                    {"appointment_id": appointment_id},
                )

                record = cur.fetchone()
                slots_booked = record.get("slots_booked")
                capacity = record.get("capacity")
                appointment_confirmation_code = record.get("confirmation_code")

                # If there aren't enough slots, don't book the appointment
                if slots_booked >= capacity:
                    conn.rollback()
                    return Response(message="Appointment already full", status=409)

                if slots_booked == 0:
                    conn.rollback()
                    return Response(
                        message="Appointment is empty; new appointment should be booked",
                        status=409,
                    )

                # If the confirmation codes don't match, don't book the appointment
                if appointment_confirmation_code is not None:
                    if confirmation_code != appointment_confirmation_code:
                        conn.rollback()
                        return Response(
                            response="Incorrect confirmation code", status=401
                        )

                cur.execute(
                    """
                    SELECT COUNT(*) > 0 AS already_booked
                    FROM Bookings b
                    WHERE b.appointmentID = %(appointment_id)s
                      AND b.userID = %(user_id)s;
                    """,
                    {"appointment_id": appointment_id, "user_id": current_user.user_id},
                )

                record = cur.fetchone()

                # If the user has already booked the appointment, don't book another slot
                if record != None and record.get("already_booked"):
                    conn.rollback()
                    return Response("Already booked this appointment", status=409)

                # Now that we know there's enough slots, reserve it
                cur.execute(
                    """
                    INSERT INTO Bookings
                    (appointmentID, userID, bookingTimestamp, comments)
                    VALUES
                    (%(appointment_id)s, %(user_id)s, CURRENT_TIMESTAMP, %(comments)s);
                    """,
                    {
                        "appointment_id": appointment_id,
                        "user_id": current_user.user_id,
                        "comments": comments,
                    },
                )

                return jsonify(
                    {
                        "message": "Successfully booked appointment",
                    }
                )

        except SerializationFailure:
            tries += 1
            time.sleep(2 * tries)

    return Response(message="Failed to book appointment", status_code=409)


@bp.delete("/cancel_appointment")
@jwt_required()
def cancel_appointment():
    json: dict | None = request.get_json()
    if json is None:
        return Response(
            response="Didn't send JSON to cancel_appointment DELETE request", status=400
        )
    if not "appointment_id" in json:
        return Response(
            response="Appointment ID not present in cancel_appointment DELETE request",
            status=400,
        )

    user: User | None = get_current_user()

    if user is None:
        return Response(response="No valid user logged in", status=401)

    appointment_id: int
    try:
        appointment_id = int(json["appointment_id"])
    except ValueError as e:
        print(str(e))
        return Response(
            response="Invalid appointment ID sent to cancel_appointment DELETE request"
        )

    if appointment_id < 1:
        return Response(
            response="Invalid appointment ID sent to cancel_appointment DELETE request"
        )

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            with pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)

                cur.execute(
                    """
                    SELECT *
                    FROM Bookings
                    WHERE userID = %(user_id)s AND appointmentID = %(appointment_id)s;
                    """,
                    {"user_id": user.user_id, "appointment_id": appointment_id},
                )

                record = cur.fetchone()

                if record is None:
                    return Response(
                        response="Tried to cancel appointment that wasn't booked",
                        status=400,
                    )

                cur.execute(
                    """
                    DELETE FROM Bookings
                    WHERE userID = %(user_id)s AND appointmentID = %(appointment_id)s;
                    """,
                    {"user_id": user.user_id, "appointment_id": appointment_id},
                )

                cur.execute(
                    """
                    SELECT leaderUserID
                    FROM AppointmentTimeSlots
                    WHERE appointmentID = %(appointment_id)s;
                    """,
                    {"appointment_id": appointment_id},
                )

                record = cur.fetchone()
                leader_user_id = record.get("leaderuserid")

                # If the user was not the leader, we can just return
                if leader_user_id != user.user_id:
                    return jsonify({"message": "Successfully cancelled appointment"})

                # Otherwise, we need to set a new leader based on who booked the appointment the earliest
                cur.execute(
                    """
                    SELECT userID AS user_id
                    FROM Bookings
                    WHERE appointmentID = %(appointment_id)s
                      AND bookingTimestamp = (
                            SELECT MIN(bookingTimestamp)
                            FROM Bookings
                            WHERE appointmentID = %(appointment_id)s
                        )
                    LIMIT 1;
                    """,
                    {"appointment_id": appointment_id},
                )

                record = cur.fetchone()

                if record is None:
                    # The leader was the last person to have booked that appointment, so NULL out the details fields
                    cur.execute(
                        """
                        UPDATE AppointmentTimeSlots
                        SET leaderUserID = NULL, confirmationCode = NULL, subject = NULL, location = NULL
                        WHERE appointmentID = %(appointment_id)s; 
                        """,
                        {"appointment_id": appointment_id},
                    )
                else:
                    # Set a new leader and confirmation code
                    cur.execute(
                        """
                        UPDATE AppointmentTimeSlots
                        SET leaderUserID = %(leader_user_id)s, confirmationCode = %(confirmation_code)s
                        WHERE appointmentID = %(appointment_id)s; 
                        """,
                        {
                            "leader_user_id": record.get("user_id"),
                            "confirmation_code": generate_confirmation_code(),
                            "appointment_id": appointment_id,
                        },
                    )

                return jsonify({"message": "Successfully cancelled appointment"})
        except SerializationFailure:
            tries += 1
            time.sleep(2 * tries)

    return Response(response="Failed to cancel appointment", status=400)
