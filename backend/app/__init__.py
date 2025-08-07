from flask import Flask
from .config import Config, DevelopmentConfig


def create_app(config: Config = DevelopmentConfig()):
    app = Flask(__name__)
    app.config.from_object(config)

    from .jwt import jwt
    from .db import db
    from . import book
    from . import auth

    jwt.init_app(app)
    db.init_app(app)
    app.register_blueprint(book.bp)
    app.register_blueprint(auth.bp)

    return app
