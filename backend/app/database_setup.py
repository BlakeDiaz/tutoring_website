from psycopg_pool import ConnectionPool
from .config import config

name = config["credentials.database"]["name"]
user = config["credentials.database"]["user"]
password = config["credentials.database"]["password"]

pool = ConnectionPool(
    conninfo=f"dbname={name} user={user} password={password}", open=True
)
