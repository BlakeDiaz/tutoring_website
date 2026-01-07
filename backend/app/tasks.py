import procrastinate 
from configparser import ConfigParser
from .db import db
from sqlalchemy import text
import random
from psycopg.errors import SerializationFailure
import time

TRANSACTION_RETRY_AMOUNT = 3

config = ConfigParser()
config.read("/run/secrets/backend_config")

procrastinate_app = procrastinate.App(
    connector=procrastinate.PsycopgConnector(
        kwargs={
            "user": config["credentials.database"]["user"],
            "host": config["credentials.database"]["host"],
            "password": config["credentials.database"]["password"],
            "dbname": config["credentials.database"]["name"],
            "port": config["credentials.database"]["port"],
        }
    )
)

def generate_confirmation_code():
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

@procrastinate_app.task(queue="bookings")
def book_new_appointment_task(appointment_id: int, user_id: int, comments: str, subject: str, location: str):
    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            # Now that we know there is a clear appointment, book it
            db.session.execute(
                text(
                    """
                    UPDATE Bookings
                    SET comments = :comments, pending = FALSE
                    WHERE appointmentID = :appointment_id
                      AND userID = :user_id;
                    """
                ),
                {
                    "appointment_id": appointment_id,
                    "user_id": user_id,
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
                    "leader_user_id": user_id,
                    "confirmation_code": generate_confirmation_code(),
                    "subject": subject,
                    "location": location,
                    "appointment_id": appointment_id,
                },
            )

            db.session.commit()
            return
        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

@procrastinate_app.task(queue="bookings")
def book_existing_appointment_task(appointment_id: int, user_id: int, comments: str):
    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
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
                    "user_id": user_id,
                    "comments": comments,
                },
            )

            db.session.commit()
            return
        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)

@procrastinate_app.task(queue="bookings")
def cancel_appointment_task(appointment_id: int, user_id: int):
    tries = 0
    while tries < TRANSACTION_RETRY_AMOUNT:
        try:
            db.session.execute(
                text(
                    """
                    DELETE FROM Bookings
                    WHERE userID = :user_id AND appointmentID = :appointment_id;
                    """,
                ),
                {"user_id": user_id, "appointment_id": appointment_id},
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
            if leader_user_id != user_id:
                db.session.commit()

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
        except SerializationFailure:
            db.session.rollback()
            tries += 1
            time.sleep(2 * tries)
