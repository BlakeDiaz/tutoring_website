from flask import Blueprint, request, Response, jsonify
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_current_user,
)
from sqlalchemy import text
from .db import db
from bcrypt import checkpw, hashpw, gensalt
from .user import User
from email_validator import validate_email, EmailNotValidError, ValidatedEmail

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    json: dict | None = request.get_json()

    if json is None:
        return Response(
            response="Didn't send JSON to register POST request", status=400
        )
    if not "name" in json:
        return Response(
            response="Name not present in register POST request", status=400
        )
    if not "email" in json:
        return Response(
            response="Email not present in register POST request", status=400
        )
    if not "password" in json:
        return Response(
            response="Password not present in register POST request", status=400
        )

    password = json["password"]

    name = json["name"]
    if len(name) > 255:
        return Response(response="Name must be at most 255 characters long", status=400)

    emailinfo: ValidatedEmail
    try:
        emailinfo = validate_email(json["email"])
    except EmailNotValidError as e:
        print(str(e))
        return Response(response=f"Invalid email address: {json["email"]}", status=400)

    email = emailinfo.normalized

    record = (
        db.session.execute(
            text(
                """
                SELECT *
                FROM Users
                WHERE email = :email;
                """
            ),
            {"email": email},
        )
        .mappings()
        .fetchone()
    )
    if record is not None:
        return Response(
            response=f"Account with email {email} already present", status=409
        )

    db.session.execute(
        text(
            """
            INSERT INTO Users
            (name, email, passwordSaltedHashed)
            VALUES
            (:name, :email, :password_hashed);
            """
        ),
        {
            "name": name,
            "email": email,
            "password_hashed": hashpw(bytes(password, "utf-8"), gensalt()),
        },
    )
    record = (
        db.session.execute(
            text(
                """
                SELECT *
                FROM Users
                WHERE email = :email;
                """
            ),
            {"email": email},
        )
        .mappings()
        .fetchone()
    )

    user = User(
        user_id=record.get("userid"),
        name=record.get("name"),
        email=record.get("email"),
    )

    db.session.commit()
    response = jsonify({"message": "Successfully registered account!"})
    access_token = create_access_token(identity=user)
    set_access_cookies(response, access_token)
    return response


@bp.post("/login")
def login():
    json: dict | None = request.get_json()

    if json is None:
        return Response(response="Didn't send JSON to login POST request", status=400)
    if not "email" in json:
        return Response(response="Email not present in login POST request", status=400)
    if not "password" in json:
        return Response(
            response="Password not present in login POST request", status=400
        )

    email = json["email"]
    password = json["password"]

    record = (
        db.session.execute(
            text(
                """
                SELECT *
                FROM Users
                WHERE email = :email;
                """
            ),
            {"email": email},
        )
        .mappings()
        .fetchone()
    )
    if record is None:
        return Response(response=f"No account with email {email} present", status=400)

    user = User(
        user_id=record.get("userid"),
        name=record.get("name"),
        email=record.get("email"),
    )

    password_hashed = record.get("passwordsaltedhashed")

    if checkpw(bytes(password, "utf-8"), password_hashed):
        response = jsonify({"message": "Login successful"})
        access_token = create_access_token(identity=user)
        set_access_cookies(response, access_token)
        return response


@bp.post("/logout")
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response


@bp.get("/get_user_info")
@jwt_required()
def get_user_info():
    user: User | None = get_current_user()
    if user is None:
        return Response(response="No valid user logged in", status=401)

    return jsonify(user.format_to_dict_for_sending())
