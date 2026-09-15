import os

os.environ["SCHEDULER_ENABLED"] = "false"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.website import Website

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    database = TestingSessionLocal()

    try:
        yield database
    finally:
        database.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_database():
    with Session(test_engine) as database:
        database.execute(delete(Incident))
        database.execute(delete(MonitorCheck))
        database.execute(delete(Website))
        database.commit()

    yield


@pytest.fixture
def database():
    database_session = TestingSessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()
