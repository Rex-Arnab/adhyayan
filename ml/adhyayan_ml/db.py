"""Database access. Everything here is read-only except the recommendation writer."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg
from dotenv import load_dotenv

# The app's .env is the single source of truth for the connection string.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set. Expected it in the project .env file.")
    return url


@contextmanager
def connect():
    with psycopg.connect(database_url()) as conn:
        yield conn
