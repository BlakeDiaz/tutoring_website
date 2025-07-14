from flask import Blueprint, request, Response, jsonify
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
)

from .database_setup import pool
from psycopg.rows import dict_row
from bcrypt import checkpw
from .user import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/login")
def login():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to register POST request", status=400
        )
    if not "email" in json:
        return Response(response="Email not present in login POST request", status=400)
    if not "password" in json:
        return Response(
            response="Password not present in login POST request", status=400
        )

    email = json["email"]
    password = json["password"]

    with pool.connection() as conn:
        cur = conn.cursor(row_factory=dict_row)

        cur.execute(
            """
            SELECT *
            FROM Users
            WHERE email = %(email)s;
            """,
            {"email": email},
        )
        record = cur.fetchone()
        if record is None:
            return Response(
                response=f"No account with email {email} present", status=400
            )

        user = User(
            user_id=record.get("userid"),
            email=record.get("email"),
            password_hashed=record.get("passwordsaltedhashed"),
        )

        if checkpw(bytes(password, "utf-8"), user.password_hashed):
            response = jsonify({"message": "Login successful"})
            access_token = create_access_token(identity=user)
            set_access_cookies(response, access_token)
            return response

    return Response(response="Incorrect email or password", status=400)


@bp.post("/logout")
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response
