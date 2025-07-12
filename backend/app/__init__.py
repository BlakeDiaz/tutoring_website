from flask import Flask
from .database_setup import pool
import atexit

atexit.register(pool.close)


def create_app():
    app = Flask(__name__)

    from . import book

    app.register_blueprint(book.bp)

    return app
