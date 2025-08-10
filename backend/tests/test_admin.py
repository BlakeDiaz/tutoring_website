from app.db import db
from sqlalchemy import text


def test_invalid_access(client, auth):
    auth.login("alice@gmail.com", "password1")

    response = client.get(
        "/api/admin/get_all_appointments",
        query_string={"start_date": "2024-01-01", "end_date": "2026-01-01"},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 401


def test_get_all_appointments(client, auth):
    auth.login("testadmin@gmail.com", "password7")

    response = client.get(
        "/api/admin/get_all_appointments",
        query_string={"start_date": "2024-01-01", "end_date": "2026-01-01"},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 10

    assert response.json["appointments"][0]["appointment_id"] == 1
    assert response.json["appointments"][0]["capacity"] == 3
    assert response.json["appointments"][0]["date"] == "2025-08-01"
    assert response.json["appointments"][0]["hour_24"] == 9
    assert response.json["appointments"][0]["slots_booked"] == 0
    assert response.json["appointments"][0].get("bookings") is None

    assert response.json["appointments"][1]["appointment_id"] == 2
    assert response.json["appointments"][1]["capacity"] == 3
    assert response.json["appointments"][1]["date"] == "2025-08-01"
    assert response.json["appointments"][1]["hour_24"] == 14
    assert response.json["appointments"][1]["slots_booked"] == 1
    assert response.json["appointments"][1]["leader_name"] == "Charlie Smith"
    assert response.json["appointments"][1]["subject"] == "Science"
    assert response.json["appointments"][1]["location"] == "Building A"

    assert len(response.json["appointments"][1]["bookings"]) == 1
    assert response.json["appointments"][1]["bookings"][0]["comments"] == "No notes"
    assert (
        response.json["appointments"][1]["bookings"][0]["email"] == "charlie@yahoo.com"
    )
    assert response.json["appointments"][1]["bookings"][0]["name"] == "Charlie Smith"

    assert response.json["appointments"][2]["appointment_id"] == 3
    assert response.json["appointments"][2]["capacity"] == 2
    assert response.json["appointments"][2]["date"] == "2025-08-01"
    assert response.json["appointments"][2]["hour_24"] == 16
    assert response.json["appointments"][2]["slots_booked"] == 0
    assert response.json["appointments"][2].get("bookings") is None

    assert response.json["appointments"][3]["appointment_id"] == 4
    assert response.json["appointments"][3]["capacity"] == 3
    assert response.json["appointments"][3]["date"] == "2025-08-02"
    assert response.json["appointments"][3]["hour_24"] == 9
    assert response.json["appointments"][3]["slots_booked"] == 0
    assert response.json["appointments"][3].get("bookings") is None

    assert response.json["appointments"][4]["appointment_id"] == 5
    assert response.json["appointments"][4]["capacity"] == 4
    assert response.json["appointments"][4]["date"] == "2025-08-02"
    assert response.json["appointments"][4]["hour_24"] == 10
    assert response.json["appointments"][4]["slots_booked"] == 0
    assert response.json["appointments"][4].get("bookings") is None

    assert response.json["appointments"][5]["appointment_id"] == 6
    assert response.json["appointments"][5]["capacity"] == 2
    assert response.json["appointments"][5]["date"] == "2025-08-03"
    assert response.json["appointments"][5]["hour_24"] == 7
    assert response.json["appointments"][5]["slots_booked"] == 2
    assert response.json["appointments"][5]["leader_name"] == "Alice Smith"
    assert response.json["appointments"][5]["subject"] == "Math"
    assert response.json["appointments"][5]["location"] == "Building B"

    assert len(response.json["appointments"][5]["bookings"]) == 2
    assert response.json["appointments"][5]["bookings"][0]["comments"] == "No comment"
    assert response.json["appointments"][5]["bookings"][0]["email"] == "alice@gmail.com"
    assert response.json["appointments"][5]["bookings"][0]["name"] == "Alice Smith"
    assert (
        response.json["appointments"][5]["bookings"][1]["comments"]
        == "Cover matrix multiplication"
    )
    assert response.json["appointments"][5]["bookings"][1]["email"] == "bob@gmail.com"
    assert response.json["appointments"][5]["bookings"][1]["name"] == "Bob Smith"

    assert response.json["appointments"][6]["appointment_id"] == 7
    assert response.json["appointments"][6]["capacity"] == 8
    assert response.json["appointments"][6]["date"] == "2025-08-04"
    assert response.json["appointments"][6]["hour_24"] == 11
    assert response.json["appointments"][6]["slots_booked"] == 0
    assert response.json["appointments"][6].get("bookings") is None

    assert response.json["appointments"][7]["appointment_id"] == 8
    assert response.json["appointments"][7]["capacity"] == 1
    assert response.json["appointments"][7]["date"] == "2025-08-05"
    assert response.json["appointments"][7]["hour_24"] == 12
    assert response.json["appointments"][7]["slots_booked"] == 0
    assert response.json["appointments"][7].get("bookings") is None

    assert response.json["appointments"][8]["appointment_id"] == 9
    assert response.json["appointments"][8]["capacity"] == 2
    assert response.json["appointments"][8]["date"] == "2025-08-05"
    assert response.json["appointments"][8]["hour_24"] == 13
    assert response.json["appointments"][8]["slots_booked"] == 0
    assert response.json["appointments"][8].get("bookings") is None

    assert response.json["appointments"][9]["appointment_id"] == 10
    assert response.json["appointments"][9]["capacity"] == 4
    assert response.json["appointments"][9]["date"] == "2025-08-06"
    assert response.json["appointments"][9]["hour_24"] == 8
    assert response.json["appointments"][9]["slots_booked"] == 0
    assert response.json["appointments"][9].get("bookings") is None


def test_get_all_appointments_with_end_date(client, auth):
    auth.login("testadmin@gmail.com", "password7")

    response = client.get(
        "/api/admin/get_all_appointments",
        query_string={"start_date": "2024-01-01", "end_date": "2025-08-05"},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert len(response.json["appointments"]) == 7

    assert response.json["appointments"][0]["appointment_id"] == 1
    assert response.json["appointments"][0]["capacity"] == 3
    assert response.json["appointments"][0]["date"] == "2025-08-01"
    assert response.json["appointments"][0]["hour_24"] == 9
    assert response.json["appointments"][0]["slots_booked"] == 0
    assert response.json["appointments"][0].get("bookings") is None

    assert response.json["appointments"][1]["appointment_id"] == 2
    assert response.json["appointments"][1]["capacity"] == 3
    assert response.json["appointments"][1]["date"] == "2025-08-01"
    assert response.json["appointments"][1]["hour_24"] == 14
    assert response.json["appointments"][1]["slots_booked"] == 1
    assert response.json["appointments"][1]["leader_name"] == "Charlie Smith"
    assert response.json["appointments"][1]["subject"] == "Science"
    assert response.json["appointments"][1]["location"] == "Building A"

    assert len(response.json["appointments"][1]["bookings"]) == 1
    assert response.json["appointments"][1]["bookings"][0]["comments"] == "No notes"
    assert (
        response.json["appointments"][1]["bookings"][0]["email"] == "charlie@yahoo.com"
    )
    assert response.json["appointments"][1]["bookings"][0]["name"] == "Charlie Smith"

    assert response.json["appointments"][2]["appointment_id"] == 3
    assert response.json["appointments"][2]["capacity"] == 2
    assert response.json["appointments"][2]["date"] == "2025-08-01"
    assert response.json["appointments"][2]["hour_24"] == 16
    assert response.json["appointments"][2]["slots_booked"] == 0
    assert response.json["appointments"][2].get("bookings") is None

    assert response.json["appointments"][3]["appointment_id"] == 4
    assert response.json["appointments"][3]["capacity"] == 3
    assert response.json["appointments"][3]["date"] == "2025-08-02"
    assert response.json["appointments"][3]["hour_24"] == 9
    assert response.json["appointments"][3]["slots_booked"] == 0
    assert response.json["appointments"][3].get("bookings") is None

    assert response.json["appointments"][4]["appointment_id"] == 5
    assert response.json["appointments"][4]["capacity"] == 4
    assert response.json["appointments"][4]["date"] == "2025-08-02"
    assert response.json["appointments"][4]["hour_24"] == 10
    assert response.json["appointments"][4]["slots_booked"] == 0
    assert response.json["appointments"][4].get("bookings") is None

    assert response.json["appointments"][5]["appointment_id"] == 6
    assert response.json["appointments"][5]["capacity"] == 2
    assert response.json["appointments"][5]["date"] == "2025-08-03"
    assert response.json["appointments"][5]["hour_24"] == 7
    assert response.json["appointments"][5]["slots_booked"] == 2
    assert response.json["appointments"][5]["leader_name"] == "Alice Smith"
    assert response.json["appointments"][5]["subject"] == "Math"
    assert response.json["appointments"][5]["location"] == "Building B"

    assert len(response.json["appointments"][5]["bookings"]) == 2
    assert response.json["appointments"][5]["bookings"][0]["comments"] == "No comment"
    assert response.json["appointments"][5]["bookings"][0]["email"] == "alice@gmail.com"
    assert response.json["appointments"][5]["bookings"][0]["name"] == "Alice Smith"
    assert (
        response.json["appointments"][5]["bookings"][1]["comments"]
        == "Cover matrix multiplication"
    )
    assert response.json["appointments"][5]["bookings"][1]["email"] == "bob@gmail.com"
    assert response.json["appointments"][5]["bookings"][1]["name"] == "Bob Smith"

    assert response.json["appointments"][6]["appointment_id"] == 7
    assert response.json["appointments"][6]["capacity"] == 8
    assert response.json["appointments"][6]["date"] == "2025-08-04"
    assert response.json["appointments"][6]["hour_24"] == 11
    assert response.json["appointments"][6]["slots_booked"] == 0
    assert response.json["appointments"][6].get("bookings") is None


def test_add_appointment_slot(client, auth):
    auth.login("testadmin@gmail.com", "password7")

    date = "2025-09-12"
    hour_24 = 14
    capacity = 5

    response = client.post(
        "/api/admin/add_appointment_time_slot",
        json={"date": date, "hour_24": hour_24, "capacity": capacity},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200

    appointment_record = (
        db.session.execute(
            text(
                "SELECT * FROM AppointmentTimeSlots WHERE date = :date AND hour24 = :hour_24;"
            ),
            {"date": date, "hour_24": hour_24},
        )
        .mappings()
        .fetchone()
    )

    assert str(appointment_record.get("date")) == date
    assert appointment_record.get("hour24") == hour_24
    assert appointment_record.get("capacity") == capacity
    assert appointment_record.get("leaderuserid") is None
    assert appointment_record.get("confirmationcode") is None
    assert appointment_record.get("subject") is None
    assert appointment_record.get("location") is None


def test_add_appointment_slot_that_already_exists(client, auth):
    auth.login("testadmin@gmail.com", "password7")

    response = client.post(
        "/api/admin/add_appointment_time_slot",
        json={"date": "2025-08-01", "hour_24": 9, "capacity": 5},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 409


def test_remove_appointment_time_slot(client, auth):
    auth.login("testadmin@gmail.com", "password7")

    appointment_id = 1

    response = client.delete(
        "/api/admin/remove_appointment_time_slot",
        json={"appointment_id": appointment_id},
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200

    appointment_record = db.session.execute(
        text(
            "SELECT * FROM AppointmentTimeSlots WHERE appointmentID = :appointment_id;"
        ),
        {"appointment_id": appointment_id},
    ).fetchone()
    assert appointment_record is None
