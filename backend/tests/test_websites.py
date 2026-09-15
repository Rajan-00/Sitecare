from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
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
client = TestClient(app)


def setup_function() -> None:
    with Session(test_engine) as database:
        database.execute(delete(Website))
        database.commit()


def test_create_and_list_websites() -> None:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Example Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Example Website"
    assert response.json()["is_active"] is True

    response = client.get("/api/v1/websites")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_duplicate_website_is_rejected() -> None:
    payload = {
        "name": "Example Website",
        "url": "https://example.com",
        "check_interval_minutes": 5,
    }

    first_response = client.post("/api/v1/websites", json=payload)
    second_response = client.post("/api/v1/websites", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409