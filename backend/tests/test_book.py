from app.db import db
from sqlalchemy import text


def test_get_available_appointments_with_multiple_on_that_day(client):
    response = client.get(
        "/api/book/get_available_appointments", query_string={"date": "2025-08-01"}
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 3

    assert response.json["appointments"][0]["appointment_id"] == 1
    assert response.json["appointments"][0]["capacity"] == 3
    assert response.json["appointments"][0]["date"] == "2025-08-01"
    assert response.json["appointments"][0]["hour_24"] == 9
    assert response.json["appointments"][0]["slots_booked"] == 0

    assert response.json["appointments"][1]["appointment_id"] == 2
    assert response.json["appointments"][1]["capacity"] == 3
    assert response.json["appointments"][1]["date"] == "2025-08-01"
    assert response.json["appointments"][1]["hour_24"] == 14
    assert response.json["appointments"][1]["slots_booked"] == 1

    assert response.json["appointments"][2]["appointment_id"] == 3
    assert response.json["appointments"][2]["capacity"] == 2
    assert response.json["appointments"][2]["date"] == "2025-08-01"
    assert response.json["appointments"][2]["hour_24"] == 16
    assert response.json["appointments"][2]["slots_booked"] == 0


def test_get_available_appointments_with_full_appointment_on_that_day(client):
    response = client.get(
        "/api/book/get_available_appointments", query_string={"date": "2025-08-03"}
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 0


def test_get_available_appointments_with_no_appointments_on_that_day(client):
    response = client.get(
        "/api/book/get_available_appointments", query_string={"date": "2025-07-03"}
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 0


def test_get_scheduled_appointments_with_multiple_users_registered_for_same_appointment(
    client, auth
):
    auth.login("alice@gmail.com", "password1")

    response = client.get(
        "/api/book/get_scheduled_appointments",
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 1

    assert response.json["appointments"][0]["appointment_id"] == 6
    assert response.json["appointments"][0]["capacity"] == 2
    assert response.json["appointments"][0]["date"] == "2025-08-03"
    assert response.json["appointments"][0]["hour_24"] == 7
    assert response.json["appointments"][0]["slots_booked"] == 2
    assert response.json["appointments"][0]["leader_name"] == "Alice Smith"
    assert response.json["appointments"][0]["subject"] == "Math"
    assert response.json["appointments"][0]["location"] == "Building B"

    assert len(response.json["appointments"][0]["bookings"]) == 2

    assert response.json["appointments"][0]["bookings"][0]["name"] == "Alice Smith"
    assert response.json["appointments"][0]["bookings"][0]["email"] == "alice@gmail.com"
    assert response.json["appointments"][0]["bookings"][0]["comments"] == "No comment"

    assert response.json["appointments"][0]["bookings"][1]["name"] == "Bob Smith"
    assert response.json["appointments"][0]["bookings"][1]["email"] == "bob@gmail.com"
    assert (
        response.json["appointments"][0]["bookings"][1]["comments"]
        == "Cover matrix multiplication"
    )


def test_get_scheduled_appointments_with_no_appointments_scheduled_by_user(
    client, auth
):
    auth.login("daniel@gmail.com", "password4")

    response = client.get(
        "/api/book/get_scheduled_appointments",
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 0


def test_book_new_appointment(client, auth):
    auth.login()

    appointment_id = 1
    user_id = 6
    subject = "English"
    location = "Building Z"
    comments = "Test comment"
    old_count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]

    response = client.post(
        "/api/book/book_new_appointment",
        json={
            "appointment_id": appointment_id,
            "subject": subject,
            "location": location,
            "comments": comments,
        },
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200

    count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]
    assert count == old_count + 1

    appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id;"
            ),
            {"appointment_id": appointment_id},
        )
        .mappings()
        .fetchone()
    )
    assert appointment_record.get("leaderuserid") == user_id
    assert appointment_record.get("confirmationcode") is not None
    assert appointment_record.get("subject") == subject
    assert appointment_record.get("location") == location

    booking_record = (
        db.session.execute(
            text(
                "SELECT * FROM Bookings WHERE appointmentID = :appointment_id AND userID = :user_id"
            ),
            {"appointment_id": appointment_id, "user_id": user_id},
        )
        .mappings()
        .fetchone()
    )
    assert booking_record.get("comments") == comments


def test_book_existing_appointment(client, auth):
    auth.login()

    appointment_id = 2
    old_appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id;"
            ),
            {"appointment_id": appointment_id},
        )
        .mappings()
        .fetchone()
    )

    user_id = 6
    comments = "Test comment"
    leader_user_id = old_appointment_record.get("leaderuserid")
    confirmation_code = old_appointment_record.get("confirmationcode")
    subject = old_appointment_record.get("subject")
    location = old_appointment_record.get("location")
    old_count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]

    response = client.post(
        "/api/book/book_existing_appointment",
        json={
            "appointment_id": appointment_id,
            "comments": comments,
            "confirmation_code": confirmation_code,
        },
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200

    count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]
    assert count == old_count + 1

    appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id;"
            ),
            {"appointment_id": appointment_id},
        )
        .mappings()
        .fetchone()
    )
    assert appointment_record.get("leaderuserid") == leader_user_id
    assert appointment_record.get("confirmationcode") == confirmation_code
    assert appointment_record.get("subject") == subject
    assert appointment_record.get("location") == location

    booking_record = (
        db.session.execute(
            text(
                "SELECT * FROM Bookings WHERE appointmentID = :appointment_id AND userID = :user_id"
            ),
            {"appointment_id": appointment_id, "user_id": user_id},
        )
        .mappings()
        .fetchone()
    )
    assert booking_record.get("comments") == comments


def test_cancel_appointment_with_user_being_leader_and_user_not_only_member(
    client, auth
):
    auth.login("alice@gmail.com", "password1")

    appointment_id = 6
    user_id = 1
    old_count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]

    response = client.delete(
        "/api/book/cancel_appointment",
        json={"appointment_id": appointment_id},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200

    count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]
    assert count == old_count - 1

    cancelled_record = db.session.execute(
        text(
            "SELECT * FROM Bookings WHERE appointmentID = :appointment_id AND userID = :user_id;"
        ),
        {"appointment_id": appointment_id, "user_id": user_id},
    ).fetchone()
    assert cancelled_record is None

    appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id"
            ),
            {"appointment_id": appointment_id},
        )
        .mappings()
        .fetchone()
    )
    assert appointment_record is not None
    assert appointment_record.get("leaderuserid") == 2
    assert appointment_record.get("confirmationcode") != 387122
    assert appointment_record.get("subject") == "Math"
    assert appointment_record.get("location") == "Building B"


def test_cancel_appointment_with_user_being_only_member(client, auth):
    auth.login("charlie@yahoo.com", "password3")

    appointment_id = 2
    user_id = 3
    old_count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]

    response = client.delete(
        "/api/book/cancel_appointment",
        json={"appointment_id": appointment_id},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    print(response.data)
    assert response.status_code == 200

    count = db.session.execute(text("SELECT COUNT(*) FROM Bookings;")).fetchone()[0]
    assert count == old_count - 1

    cancelled_record = db.session.execute(
        text(
            "SELECT * FROM Bookings WHERE appointmentID = :appointment_id AND userID = :user_id;"
        ),
        {"appointment_id": appointment_id, "user_id": user_id},
    ).fetchone()
    assert cancelled_record is None

    appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id"
            ),
            {"appointment_id": appointment_id},
        )
        .mappings()
        .fetchone()
    )
    assert appointment_record is not None
    assert appointment_record.get("appointmentid") is not None
    assert appointment_record.get("date") is not None
    assert appointment_record.get("hour24") is not None
    assert appointment_record.get("capacity") is not None
    assert appointment_record.get("leaderuserid") is None
    assert appointment_record.get("confirmationcode") is None
    assert appointment_record.get("subject") is None
    assert appointment_record.get("location") is None


def test_cancel_appointment_that_is_not_booked_by_user(client, auth):
    auth.login()

    appointment_id = 1

    response = client.delete(
        "/api/book/cancel_appointment",
        json={"appointment_id": appointment_id},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 400
