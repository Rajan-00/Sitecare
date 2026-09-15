import os
from datetime import UTC, datetime

os.environ["SCHEDULER_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import (
    create_engine,
    delete,
)
from sqlalchemy.orm import (
    Session,
    sessionmaker,
)
from sqlalchemy.pool import StaticPool

from app.api.dependencies import (
    get_current_user,
)
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.notification_preference import (
    NotificationPreference,
)
from app.models.user import User
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


def override_get_current_user() -> User:
    return User(
        id=999,
        full_name="Test Administrator",
        email="test@sitecare.com",
        hashed_password="not-used-in-tests",
        is_active=True,
        created_at=datetime.now(UTC),
    )


app.dependency_overrides[get_db] = override_get_db

app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def unauthenticated_client():
    authentication_override = app.dependency_overrides.pop(
        get_current_user,
        None,
    )

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        if authentication_override:
            app.dependency_overrides[get_current_user] = authentication_override


@pytest.fixture
def database():
    database_session = TestingSessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()


@pytest.fixture(autouse=True)
def clean_database():
    with Session(test_engine) as database:
        database.execute(delete(Incident))
        database.execute(delete(MonitorCheck))
        database.execute(delete(NotificationPreference))
        database.execute(delete(User))
        database.execute(delete(Website))
        database.commit()

    yield
