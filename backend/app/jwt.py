from flask_jwt_extended import JWTManager
from sqlalchemy import text
from .user import User
from .db import db

jwt = JWTManager()


@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user.user_id)


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    record = (
        db.session.execute(
            text(
                """
                SELECT *
                FROM Users
                WHERE userID = :user_id;
                """
            ),
            {"user_id": identity},
        )
        .mappings()
        .fetchone()
    )

    if record is None:
        return None

    return User(
        user_id=record.get("userid"),
        name=record.get("name"),
        email=record.get("email"),
    )
