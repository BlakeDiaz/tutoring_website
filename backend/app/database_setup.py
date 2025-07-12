from psycopg_pool import ConnectionPool
from configparser import ConfigParser
import os

dirname = os.path.dirname(__file__)
config = ConfigParser()
config.read(os.path.join(dirname, "../config.ini"))
name = config["credentials.database"]["name"]
user = config["credentials.database"]["user"]
password = config["credentials.database"]["password"]

pool = ConnectionPool(
    conninfo=f"dbname={name} user={user} password={password}", open=True
)
