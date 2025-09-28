from flask import Blueprint, request, jsonify, Response
from sqlalchemy import text
from .db import db
from psycopg.errors import SerializationFailure
from flask_jwt_extended import jwt_required, get_current_user
from .user import User
from .validate import validate_date
import time
import random

TRANSACTION_RETRY_AMOUNT = 3

bp = Blueprint("book", __name__, url_prefix="/api/book")


def generate_confirmation_code():
    return "".join([str(random.randint(0, 9)) for _ in range(6)])


@bp.get("/get_available_appointments")
def get_available_appointments():
    start_date = request.args.get("start_date")
    if not validate_date(start_date):
        return Response(response=f"Invalid start date: {start_date}", status=400)

    end_date = request.args.get("end_date")
    if not validate_date(end_date):
        return Response(response=f"Invalid enddate: {end_date}", status=400)

    records = (
        db.session.execute(
            text(
                """
                SELECT ats.appointmentID AS appointment_id, ats.date AS date, ats.hour24 AS hour_24,
                       ats.capacity AS capacity, COUNT(b.userID) AS slots_booked
                FROM AppointmentTimeSlots ats
                LEFT OUTER JOIN Bookings b
                    ON ats.appointmentID = b.appointmentID
                LEFT OUTER JOIN Users u
                    ON ats.leaderUserID = u.userID
                WHERE ats.date >= :start_date
                  AND ats.date < :end_date
                GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity
                HAVING ats.capacity - COUNT(b.userID) > 0
                ORDER BY ats.hour24 ASC;
                """
            ),
            {"start_date": start_date, "end_date": end_date},
        )
        .mappings()
        .fetchall()
    )

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


@bp.get("/get_scheduled_appointments")
@jwt_required()
def get_user_appointments():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="Permission denied", status=401)

    records = (
        db.session.execute(
            text(
                """
                WITH ScheduledAppointments AS (
                SELECT ats.appointmentID AS appointmentID, ats.date AS date, ats.hour24 AS hour24,
                       ats.capacity AS capacity, COUNT(b.userID) AS slotsBooked, ats.leaderUserID AS leaderUserID,
                       ats.subject AS subject, ats.location AS location, ats.confirmationCode AS confirmationCode
                FROM AppointmentTimeSlots ats
                INNER JOIN Bookings b
                    ON ats.appointmentID = b.appointmentID
                WHERE ats.appointmentID IN (SELECT appointmentID FROM Bookings WHERE userID = :user_id)
                GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity, ats.leaderUserID, ats.subject,
                         ats.location
            )
            SELECT sa.appointmentID AS appointment_id, sa.date AS date, sa.hour24 AS hour_24, sa.capacity AS capacity,
                   sa.slotsBooked AS slots_booked, u1.name AS leader_name, sa.subject AS subject,
                   sa.location AS location, sa.confirmationCode AS confirmation_code, u2.name AS user_name,
                   u2.email AS user_email, b.comments AS user_comments
            FROM ScheduledAppointments sa
            INNER JOIN Bookings b
                ON sa.appointmentID = b.appointmentID
            INNER JOIN Users u1
                ON sa.leaderUserID = u1.userID
            INNER JOIN Users u2
                ON b.userID = u2.userID
            ORDER BY sa.date ASC, sa.hour24 ASC, u2.name ASC;
            """
            ),
            {"user_id": user.user_id},
        )
        .mappings()
        .fetchall()
    )

    appointments = []
    appointments_to_bookings: dict[int, list[dict[str, str]]] = dict()
    for record in records:
        appointment_id = record.get("appointment_id")
        if appointment_id in appointments_to_bookings:
            appointments_to_bookings[appointment_id].append(
                {
                    "name": record.get("user_name"),
                    "email": record.get("user_email"),
                    "comments": record.get("user_comments"),
                }
            )
        else:
            appointments_to_bookings[appointment_id] = [
                {
                    "name": record.get("user_name"),
                    "email": record.get("user_email"),
                    "comments": record.get("user_comments"),
                }
            ]

    seen: set[int] = set()
    for record in records:
        if record.get("appointment_id") in seen:
            continue
        seen.add(record.get("appointment_id"))

        appointments.append(
            {
                "appointment_id": record.get("appointment_id"),
                "date": str(record.get("date")),
                "hour_24": record.get("hour_24"),
                "capacity": record.get("capacity"),
                "slots_booked": record.get("slots_booked"),
                "leader_name": record.get("leader_name"),
                "subject": record.get("subject"),
                "location": record.get("location"),
                "confirmation_code": record.get("confirmation_code"),
                "bookings": appointments_to_bookings[record.get("appointment_id")],
            }
        )

    return jsonify({"appointments": appointments})


@bp.post("/book_new_appointment")
@jwt_required()
def book_new_appointment():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="Permission denied", status=401)

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
            record = (
                db.session.execute(
                    text(
                        """
                        SELECT COUNT(*) > 0 AS appointment_is_valid
                        FROM AppointmentTimeSlots ats
                        LEFT OUTER JOIN Bookings b
                            ON ats.appointmentID = b.appointmentID
                        WHERE ats.appointmentID = :appointment_id
                          AND b.userID IS NULL;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            appointment_is_valid = record.get("appointment_is_valid")

            # Conflict error code is used here since if this error occurs it is likely that another person already
            # booked this appointment before the request was processed
            if not appointment_is_valid:
                db.session.rollback()
                return Response(
                    response="Appointment does not exist or already has been booked",
                    status=409,
                )

            # Now that we know there is a clear appointment, book it
            db.session.execute(
                text(
                    """
                    INSERT INTO Bookings
                    (appointmentID, userID, bookingTimestamp, comments)
                    VALUES
                    (:appointment_id, :user_id, CURRENT_TIMESTAMP, :comments);
                    """
                ),
                {
                    "appointment_id": appointment_id,
                    "user_id": user.user_id,
                    "comments": comments,
                },
            )

            # Assign the user as the current leader, and set the subject and location
            db.session.execute(
                text(
                    """
                    UPDATE AppointmentTimeSlots
                    SET leaderUserID = :leader_user_id, confirmationCode = :confirmation_code,
                        subject = :subject, location = :location
                    WHERE appointmentID = :appointment_id;
                    """
                ),
                {
                    "leader_user_id": user.user_id,
                    "confirmation_code": generate_confirmation_code(),
                    "subject": subject,
                    "location": location,
                    "appointment_id": appointment_id,
                },
            )

            db.session.commit()

            return jsonify(
                {
                    "message": "Successfully booked appointment",
                }
            )

        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

    return Response(response="Failed to book appointment", status_code=500)


@bp.post("/book_existing_appointment")
@jwt_required()
def book_existing_appointment():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="Permission denied", status=401)

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
    if not "confirmation_code" in json:
        return Response(
            response="Confirmation code not present in book_existing_appointment POST request",
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
    confirmation_code = json["confirmation_code"]

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
            record = (
                db.session.execute(
                    text(
                        """
                        SELECT ats.capacity AS capacity, COUNT(b.userID) AS slots_booked,
                               ats.leaderUserID AS leader_user_id, ats.confirmationCode AS confirmation_code
                        FROM AppointmentTimeSlots ats
                        LEFT OUTER JOIN Bookings b
                            ON ats.appointmentID = b.appointmentID
                        WHERE ats.appointmentID = :appointment_id
                        GROUP BY ats.appointmentID, ats.capacity;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            slots_booked = record.get("slots_booked")
            capacity = record.get("capacity")
            appointment_confirmation_code = record.get("confirmation_code")

            # Conflict error code is used here since if this error occurs it is likely that others fully booked the
            # appointment before this request was processed, leading to slots_booked being at/exceeding capacity
            if slots_booked >= capacity:
                db.session.rollback()
                return Response(response="Appointment already full", status=409)

            # Conflict error code is used here since if this error occurs it is likely that the other people who
            # booked this appointment cancelled it, leading to slots_booked being 0
            if slots_booked == 0:
                db.session.rollback()
                return Response(
                    response="Appointment is empty; new appointment should be booked",
                    status=409,
                )

            # If the confirmation codes don't match, don't book the appointment
            if appointment_confirmation_code is not None:
                if confirmation_code != appointment_confirmation_code:
                    db.session.rollback()
                    return Response(response="Incorrect confirmation code", status=401)

            record = (
                db.session.execute(
                    text(
                        """
                        SELECT COUNT(*) > 0 AS already_booked
                        FROM Bookings b
                        WHERE b.appointmentID = :appointment_id
                          AND b.userID = :user_id;
                        """
                    ),
                    {"appointment_id": appointment_id, "user_id": user.user_id},
                )
                .mappings()
                .fetchone()
            )

            # If the user has already booked the appointment, don't book another slot
            if record != None and record.get("already_booked"):
                db.session.rollback()
                return Response("Already booked this appointment", status=409)

            # Now that we know there's enough slots, reserve it
            db.session.execute(
                text(
                    """
                    INSERT INTO Bookings
                    (appointmentID, userID, bookingTimestamp, comments)
                    VALUES
                    (:appointment_id, :user_id, CURRENT_TIMESTAMP, :comments);
                    """
                ),
                {
                    "appointment_id": appointment_id,
                    "user_id": user.user_id,
                    "comments": comments,
                },
            )

            db.session.commit()

            return jsonify(
                {
                    "message": "Successfully booked appointment",
                }
            )

        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

    return Response(response="Failed to book appointment", status_code=500)


@bp.delete("/cancel_appointment")
@jwt_required()
def cancel_appointment():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="Permission denied", status=401)

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

    appointment_id: int
    try:
        appointment_id = int(json["appointment_id"])
    except ValueError as e:
        print(str(e))
        return Response(
            response="Invalid appointment ID sent to cancel_appointment DELETE request",
            status=400,
        )

    if appointment_id < 1:
        return Response(
            response="Invalid appointment ID sent to cancel_appointment DELETE request",
            status=400,
        )

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            record = (
                db.session.execute(
                    text(
                        """
                        SELECT *
                        FROM Bookings
                        WHERE userID = :user_id AND appointmentID = :appointment_id;
                        """
                    ),
                    {"user_id": user.user_id, "appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            if record is None:
                db.session.rollback()
                return Response(
                    response="Tried to cancel appointment that wasn't booked",
                    status=400,
                )

            db.session.execute(
                text(
                    """
                    DELETE FROM Bookings
                    WHERE userID = :user_id AND appointmentID = :appointment_id;
                    """,
                ),
                {"user_id": user.user_id, "appointment_id": appointment_id},
            )

            record = (
                db.session.execute(
                    text(
                        """
                        SELECT leaderUserID, confirmationCode
                        FROM AppointmentTimeSlots
                        WHERE appointmentID = :appointment_id;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            leader_user_id = record.get("leaderuserid")
            old_confirmation_code = record.get("confirmationcode")

            # If the user was not the leader, we can just return
            if leader_user_id != user.user_id:
                db.session.commit()
                return jsonify({"message": "Successfully cancelled appointment"})

            # Otherwise, we need to set a new leader based on who booked the appointment the earliest
            record = (
                db.session.execute(
                    text(
                        """
                        SELECT userID AS user_id
                        FROM Bookings
                        WHERE appointmentID = :appointment_id
                          AND bookingTimestamp = (
                                SELECT MIN(bookingTimestamp)
                                FROM Bookings
                                WHERE appointmentID = :appointment_id
                            )
                        LIMIT 1;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            if record is None:
                # The leader was the last person to have booked that appointment, so NULL out the details fields
                db.session.execute(
                    text(
                        """
                        UPDATE AppointmentTimeSlots
                        SET leaderUserID = NULL, confirmationCode = NULL, subject = NULL, location = NULL
                        WHERE appointmentID = :appointment_id; 
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
            else:
                # Set a new leader and confirmation code
                new_confirmation_code = generate_confirmation_code()
                while new_confirmation_code == old_confirmation_code:
                    new_confirmation_code = generate_confirmation_code()

                db.session.execute(
                    text(
                        """
                        UPDATE AppointmentTimeSlots
                        SET leaderUserID = :leader_user_id, confirmationCode = :confirmation_code
                        WHERE appointmentID = :appointment_id; 
                        """
                    ),
                    {
                        "leader_user_id": record.get("user_id"),
                        "confirmation_code": new_confirmation_code,
                        "appointment_id": appointment_id,
                    },
                )

            db.session.commit()
            return jsonify({"message": "Successfully cancelled appointment"})
        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

    return Response(response="Failed to cancel appointment", status=500)
