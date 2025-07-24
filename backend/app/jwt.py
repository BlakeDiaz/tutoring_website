from flask_jwt_extended import JWTManager
from .user import User
from .database_setup import pool
from psycopg.rows import dict_row

jwt = JWTManager()


@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user.user_id)


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    with pool.connection() as conn:
        cur = conn.cursor(row_factory=dict_row)

        cur.execute(
            """
            SELECT *
            FROM Users
            WHERE userID = %(user_id)s;
            """,
            {"user_id": identity},
        )
        record = cur.fetchone()
        if record is None:
            return None

    return User(
        user_id=record.get("userid"),
        email=record.get("email"),
    )
