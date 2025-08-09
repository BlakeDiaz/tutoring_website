from app.db import db
from sqlalchemy import text
from bcrypt import checkpw


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test Name",
            "email": "testname@gmail.com",
            "password": "test_password",
        },
    )
    assert response.status_code == 200

    record = (
        db.session.execute(
            text("SELECT * FROM Users WHERE email = 'testname@gmail.com';")
        )
        .mappings()
        .fetchone()
    )
    assert record is not None
    assert record.get("name") == "Test Name"
    assert record.get("email") == "testname@gmail.com"
    assert record.get("passwordsaltedhashed") is not None
    assert record.get("passwordsaltedhashed") != "test_password"
    assert checkpw(bytes("test_password", "utf-8"), record.get("passwordsaltedhashed"))


def test_login(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "alice@gmail.com",
            "password": "password1",
        },
    )
    assert response.status_code == 200
    assert client.get_cookie("csrf_access_token") != None


def test_logout(client, auth):
    auth.login()

    response = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert client.get_cookie("csrf_access_token") is None


def test_get_user_info(client, auth):
    auth.login()

    response = client.get(
        "/api/auth/get_user_info",
        headers={"X-CSRF-TOKEN": auth.csrf_access_token()},
    )
    assert response.status_code == 200
    assert response.json["name"] == "Tester"
    assert response.json["email"] == "tester@gmail.com"
