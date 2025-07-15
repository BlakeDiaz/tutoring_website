from flask import Blueprint, request, jsonify
from .database_setup import pool
from psycopg.rows import dict_row
from flask_jwt_extended import jwt_required, current_user

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
            HAVING ats.capacity - COUNT(b.userID) > 0;
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
