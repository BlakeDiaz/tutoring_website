from flask import Flask
from .database_setup import pool
from .config import config
from flask_jwt_extended import JWTManager
import atexit

atexit.register(pool.close)


def create_app():
    app = Flask(__name__)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    # TODO set to true in production
    app.config["JWT_COOKIE_SECURE"] = False
    app.config["JWT_SECRET_KEY"] = config["credentials.flask"]["jwt_secret_key"]

    jwt = JWTManager(app)

    from . import book
    from . import auth

    app.register_blueprint(book.bp)
    app.register_blueprint(auth.bp)

    return app
