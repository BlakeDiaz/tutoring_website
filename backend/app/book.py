from flask import Blueprint, request, jsonify, Response
from .database_setup import pool
from psycopg.rows import dict_row
from psycopg.errors import SerializationFailure
from flask_jwt_extended import jwt_required, current_user, get_current_user
from .user import User
import time

TRANSACTION_RETRY_AMOUNT = 3

bp = Blueprint("book", __name__, url_prefix="/api/book")


@bp.route("/get_available_appointments")
def get_available_appointments():
    date = request.args.get("date")

    with pool.connection() as conn:
        cur = conn.cursor(row_factory=dict_row)

        cur.execute(
            """
            SELECT ats.appointmentID AS appointment_id, ats.date AS date, ats.hour24 AS hour_24,
                   ats.capacity AS capacity, COUNT(b.userID) AS slots_booked
            FROM AppointmentTimeSlots ats
            LEFT OUTER JOIN Bookings b
                ON ats.appointmentID = b.appointmentID
            WHERE ats.date = %(date)s
            GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity
            HAVING ats.capacity - COUNT(b.userID) > 0
            ORDER BY ats.hour24 ASC;
            """,
            {"date": date},
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
                       ats.capacity AS capacity, COUNT(b.userID) AS slotsBooked
                FROM AppointmentTimeSlots ats
                INNER JOIN Bookings b
                    ON ats.appointmentID = b.appointmentID
                GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity
            )
            SELECT sa.appointmentID AS appointment_id, sa.date AS date, sa.hour24 AS hour_24, sa.capacity AS capacity,
                   sa.slotsBooked AS slots_booked
            FROM ScheduledAppointments sa
            INNER JOIN Bookings b
                ON sa.appointmentID = b.appointmentID
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
                }
            )

        return jsonify({"appointments": appointments})

    return jsonify({"message": "Error occured"})


@bp.post("/book_appointment")
@jwt_required()
def book_appointment():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to book_appointment POST request", status=400
        )
    if not "appointment_id" in json:
        return Response(
            response="Appointment ID not present in book_appointment POST request",
            status=400,
        )
    if not "subject" in json:
        return Response(
            response="Subject not present in book_appointment POST request", status=400
        )
    if not "location" in json:
        return Response(
            response="Location not present in book_appointment POST request", status=400
        )
    if not "comments" in json:
        return Response(
            response="Comments not present in book_appointment POST request", status=400
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

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            with pool.connection() as conn:
                cur = conn.cursor(row_factory=dict_row)
                cur.execute(
                    """
                    SELECT ats.capacity AS capacity, COUNT(b.userID) AS slots_booked
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

                # If there aren't enough slots, don't book the appointment
                if slots_booked >= capacity:
                    conn.rollback()
                    return Response(message="Appointment already full", status=409)

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
                    (appointmentID, userID, subject, location, comments)
                    VALUES
                    (%(appointment_id)s, %(user_id)s, %(subject)s, %(location)s, %(comments)s);
                    """,
                    {
                        "appointment_id": appointment_id,
                        "user_id": current_user.user_id,
                        "subject": subject,
                        "location": location,
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

    with pool.connection() as conn:
        cur = conn.cursor()

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
                response="Tried to cancel appointment that wasn't booked", status=400
            )

        cur.execute(
            """
            DELETE FROM Bookings
            WHERE userID = %(user_id)s AND appointmentID = %(appointment_id)s;
            """,
            {"user_id": user.user_id, "appointment_id": appointment_id},
        )

        return jsonify({"message": "Successfully cancelled appointment"})

    return Response(response="Failed to cancel appointment", status=400)
