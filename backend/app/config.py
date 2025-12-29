from configparser import ConfigParser
import os

dirname = os.path.dirname(__file__)
config = ConfigParser()
config.read("/run/secrets/backend_config")


class Config:
    TESTING = False
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = False
    JWT_SECRET_KEY = config["credentials.flask"]["jwt_secret_key"]
    JWT_CSRF_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    DB_USER = config["credentials.database"]["user"]
    DB_PASSWORD = config["credentials.database"]["password"]
    DB_HOST = config["credentials.database"]["host"]
    DB_PORT = config["credentials.database"]["port"]
    DB_NAME = config["credentials.database"]["name"]

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return f"postgresql+psycopg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


class ProductionConfig(Config):
    JWT_COOKIE_SECURE = True


class DevelopmentConfig(Config):
    pass


class TestingConfig(Config):
    TESTING = True
    DB_NAME = config["credentials.test_database"]["name"]
