import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(
    __file__
).resolve().parent

load_dotenv(
    BASE_DIR / ".env"
)


def normalize_database_url(database_url):
    """
    Convert a generic MySQL URL into a PyMySQL-compatible
    SQLAlchemy database URL.

    Railway may provide:
        mysql://user:password@host:port/database

    SQLAlchemy with PyMySQL expects:
        mysql+pymysql://user:password@host:port/database
    """
    database_url = str(
        database_url or ""
    ).strip()

    if database_url.startswith(
        "mysql://"
    ):
        database_url = database_url.replace(
            "mysql://",
            "mysql+pymysql://",
            1,
        )

    return database_url


class Config:
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "development-secret-key",
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "development-jwt-secret-key",
    )

    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root:password@localhost:3306/artvault_db",
        )
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    MAX_CONTENT_LENGTH = (
        5 * 1024 * 1024
    )

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    )

    FRONTEND_URLS = os.getenv(
        "FRONTEND_URLS",
        "",
    )

    JSON_SORT_KEYS = False