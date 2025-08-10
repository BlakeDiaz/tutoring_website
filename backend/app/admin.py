from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_current_user
from .user import User
from sqlalchemy import text
from .db import db
from psycopg.errors import SerializationFailure
from functools import wraps
from .validate import validate_date, validate_hour_24, validate_capacity
import time

TRANSACTION_RETRY_AMOUNT = 3

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def role_required(role: str):
    def wrapper(f):
        @wraps(f)
        def decorator(*args, **kwargs):
            user: User | None = get_current_user()
            if user is None:
                return Response(response="User not logged in!", status=401)

            record = (
                db.session.execute(
                    text(
                        """
                        SELECT COUNT(*) > 0 AS user_has_role
                        FROM Users u
                        INNER JOIN UserRoles ur
                            ON u.userID = ur.userID
                        WHERE u.userID = :user_id
                          AND ur.userRole = :role;
                        """
                    ),
                    {"user_id": user.user_id, "role": role},
                )
                .mappings()
                .fetchone()
            )

            if record is None:
                return Response(response="Error checking user permissions", status=500)

            user_has_role = record.get("user_has_role")

            if user_has_role is None:
                return Response(response="Error checking user permissions", status=500)

            if not user_has_role:
                return Response(
                    response="Permission denied",
                    status=401,
                )

            return f(*args, **kwargs)

        return decorator

    return wrapper


@bp.get("/is_admin")
@jwt_required()
@role_required("admin")
def is_admin():
    return Response(status=200)


@bp.post("/add_appointment_time_slot")
@jwt_required()
@role_required("admin")
def add_appointment_time_slot():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="Permission denied", status=401)

    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to add_appointment_time_slot POST request",
            status=400,
        )
    if not "date" in json:
        return Response(
            response="Date not present in add_appointment_time_slot POST request",
            status=400,
        )
    if not "hour_24" in json:
        return Response(
            response="Hour_24 not present in add_appointment_time_slot  POST request",
            status=400,
        )
    if not "capacity" in json:
        return Response(
            response="Capacity not present in add_appointment_time_slot POST request",
            status=400,
        )

    date = json["date"]
    if not validate_date(date):
        return Response(response=f"Invalid date: {date}", status=400)

    hour_24 = json["hour_24"]
    if not validate_hour_24(hour_24):
        return Response(response=f"Invalid hour_24: {hour_24}", status=400)

    capacity = json["capacity"]
    if not validate_capacity(capacity):
        return Response(response=f"Invalid capacity: {capacity}", status=400)

    appointment_exists_record = (
        db.session.execute(
            text(
                """
                SELECT COUNT(*) > 0 AS appointment_exists
                FROM AppointmentTimeSlots
                WHERE date = :date
                  AND hour24 = :hour_24;
                """
            ),
            {"date": date, "hour_24": hour_24},
        )
        .mappings()
        .fetchone()
    )

    if appointment_exists_record is None:
        return Response("Failed to add appointment time slot", status=500)

    appointment_exists = appointment_exists_record.get("appointment_exists")
    if appointment_exists is None:
        return Response("Failed to add appointment time slot", status=500)

    if appointment_exists:
        return Response("Appointment time slot already exists", status=409)

    db.session.execute(
        text(
            """
            INSERT INTO AppointmentTimeSlots
            (date, hour24, capacity)
            VALUES
            (:date, :hour_24, :capacity);
            """
        ),
        {"date": date, "hour_24": hour_24, "capacity": capacity},
    )

    db.session.commit()
    return jsonify({"message": "Successfully added appointment time slot"})


@bp.delete("/remove_appointment_time_slot")
@jwt_required()
@role_required("admin")
def remove_appointment_time_slot():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to remove_appointment_time_slot DELETE request",
            status=400,
        )
    if not "appointment_id" in json:
        return Response(
            response="Appointment ID not present in remove_appointment_time_slot DELETE request",
            status=400,
        )

    appointment_id: int
    try:
        appointment_id = int(json["appointment_id"])
    except ValueError as e:
        print(str(e))
        return Response(f"Invalid appointment ID: {appointment_id}", status=400)
    if appointment_id < 1:
        return Response(f"Invalid appointment ID: {appointment_id}", status=400)

    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            appointment_record = (
                db.session.execute(
                    text(
                        """
                        SELECT appointmentID AS appointment_id, date AS date, hour24 AS hour_24
                        FROM AppointmentTimeSlots
                        WHERE appointmentID = :appointment_id;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchone()
            )

            if appointment_record is None:
                return Response(
                    f"Appointment time slot with id {appointment_id} does not exist",
                    status=409,
                )

            user_email_records = (
                db.session.execute(
                    text(
                        """
                        SELECT u.email AS email
                        FROM Bookings b
                        INNER JOIN Users u
                            ON b.userID = u.userID
                        WHERE b.appointmentID = :appointment_id;
                        """
                    ),
                    {"appointment_id": appointment_id},
                )
                .mappings()
                .fetchall()
            )
            for record in user_email_records:
                # TODO notify users that their appointment has been cancelled
                pass

            db.session.execute(
                text(
                    """
                    DELETE FROM Bookings
                    WHERE appointmentID = :appointment_id;
                    """
                ),
                {"appointment_id": appointment_id},
            )

            db.session.execute(
                text(
                    """
                    DELETE FROM AppointmentTimeSlots
                    WHERE appointmentID = :appointment_id; 
                    """
                ),
                {"appointment_id": appointment_id},
            )

            db.session.commit()
            return jsonify({"message": "Successfully removed appointment time slot"})
        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

    return Response(response="Failed to remove appointment time slot", status_code=500)


@bp.get("/get_all_appointments")
@jwt_required()
@role_required("admin")
def get_all_appointments():
    start_date = request.args.get("start_date")
    if not validate_date(start_date):
        return Response(response=f"Invalid start date: {start_date}", status=400)

    end_date = request.args.get("end_date")
    if not validate_date(end_date):
        return Response(response=f"Invalid end date: {end_date}", status=400)

    appointment_records = (
        db.session.execute(
            text(
                """
                WITH Appointments AS (
                    SELECT ats.appointmentID AS appointmentID, ats.date AS date, ats.hour24 AS hour24,
                           ats.capacity AS capacity, COUNT(b.userID) AS slotsBooked, ats.leaderUserID AS leaderUserID,
                           ats.subject AS subject, ats.location AS location
                    FROM AppointmentTimeSlots ats
                    LEFT OUTER JOIN Bookings b
                        ON ats.appointmentID = b.appointmentID
                    GROUP BY ats.appointmentID, ats.date, ats.hour24, ats.capacity, ats.leaderUserID, ats.subject,
                             ats.location
                )
                SELECT a.appointmentID AS appointment_id, a.date AS date, a.hour24 AS hour_24, a.capacity AS capacity,
                       a.slotsBooked AS slots_booked, u1.name AS leader_name, a.subject AS subject,
                       a.location AS location, u2.name AS user_name, u2.email AS user_email, b.comments AS user_comments
                FROM Appointments a
                LEFT OUTER JOIN Bookings b
                    ON a.appointmentID = b.appointmentID
                LEFT OUTER JOIN Users u1
                    ON a.leaderUserID = u1.userID
                LEFT OUTER JOIN Users u2
                    ON b.userID = u2.userID
                WHERE a.date >= :start_date
                  AND a.date < :end_date
                ORDER BY a.date ASC, a.hour24 ASC, u2.name ASC;
                """
            ),
            {"start_date": start_date, "end_date": end_date},
        )
        .mappings()
        .fetchall()
    )

    if appointment_records is None:
        return jsonify({"appointments": []})

    appointments = []
    appointments_to_bookings: dict[int, list[dict[str, str]]] = dict()
    for record in appointment_records:
        appointment_id = record.get("appointment_id")
        if appointment_id in appointments_to_bookings:
            appointments_to_bookings[appointment_id].append(
                {
                    "name": record.get("user_name"),
                    "email": record.get("user_email"),
                    "comments": record.get("user_comments"),
                }
            )
        elif record.get("slots_booked") > 0:
            appointments_to_bookings[appointment_id] = [
                {
                    "name": record.get("user_name"),
                    "email": record.get("user_email"),
                    "comments": record.get("user_comments"),
                }
            ]

    seen: set[int] = set()
    for record in appointment_records:
        if record.get("appointment_id") in seen:
            continue
        seen.add(record.get("appointment_id"))

        if record.get("slots_booked") > 0:
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
                    "bookings": appointments_to_bookings[record.get("appointment_id")],
                }
            )
        else:
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
