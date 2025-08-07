from flask import Flask
from .config import config


def create_app():
    app = Flask(__name__)

    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    # TODO set to true in production
    app.config["JWT_COOKIE_SECURE"] = False
    app.config["JWT_SECRET_KEY"] = config["credentials.flask"]["jwt_secret_key"]
    app.config["JWT_CSRF_METHODS"] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

    from .jwt import jwt

    jwt.init_app(app)

    db_config = config["credentials.database"]
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql+psycopg://{db_config["user"]}:{db_config["password"]}"
        + f"@{db_config["host"]}:{db_config["port"]}/{db_config["name"]}"
    )

    from .db import db

    db.init_app(app)

    from . import book
    from . import auth

    app.register_blueprint(book.bp)
    app.register_blueprint(auth.bp)

    return app
