import pytest
import os
from app import create_app
from app.config import TestingConfig
from app.db import db as app_db
from sqlalchemy import text

_data_sql: str
with open(os.path.join(os.path.dirname(__file__), "data.sql"), "rb") as f:
    _data_sql = f.read().decode("utf8")


@pytest.fixture()
def app():
    app = create_app(TestingConfig())
    app.test_client().post()

    with app.app_context():
        app_db.session.execute(text(_data_sql))
        yield app


@pytest.fixture()
def client(app):
    return app.test_client()


class AuthActions:
    def __init__(self, client):
        self._client = client

    def login(self, email="tester@gmail.com", password="password6"):
        return self._client.post(
            "/api/auth/login", json={"email": email, "password": password}
        )

    def logout(self):
        return self._client.post(
            "/api/auth/logout",
            headers={
                "X-CSRF-TOKEN": self._client.get_cookie("csrf_access_token").value
            },
        )

    def csrf_access_token(self):
        return self._client.get_cookie("csrf_access_token").value


@pytest.fixture()
def auth(client):
    return AuthActions(client)
