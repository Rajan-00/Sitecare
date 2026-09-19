from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_db
from app.main import app


def test_root_endpoint(
    client: TestClient,
) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers[
        "content-type"
    ].startswith("application/json")

    data = response.json()

    assert data["name"] == "SiteCare AI API"
    assert data["status"] == "running"
    assert data["version"] == "1.0.0"
    assert data["documentation"] == "/docs"


def test_health_endpoint(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/health",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == (
        "sitecare-ai-api"
    )
    assert "timestamp" in data


def test_health_timestamp_is_not_empty(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/health",
    )

    timestamp = response.json()["timestamp"]

    assert isinstance(timestamp, str)
    assert len(timestamp) > 0


def test_readiness_endpoint(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/health/ready",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ready"
    assert data["service"] == (
        "sitecare-ai-api"
    )
    assert data["database"] == "connected"
    assert data["scheduler"] == "disabled"

    assert (
        data["scheduler_interval_seconds"]
        > 0
    )

    assert "timestamp" in data


def test_readiness_returns_503_when_database_fails(
    client: TestClient,
) -> None:
    original_override = (
        app.dependency_overrides.get(get_db)
    )

    class FailingDatabase:
        def execute(
            self,
            statement: object,
        ) -> None:
            del statement

            raise SQLAlchemyError(
                "Database unavailable",
            )

    def override_failing_database() -> (
        Generator[FailingDatabase, None, None]
    ):
        yield FailingDatabase()

    app.dependency_overrides[get_db] = (
        override_failing_database
    )

    try:
        response = client.get(
            "/api/v1/health/ready",
        )
    finally:
        if original_override is None:
            app.dependency_overrides.pop(
                get_db,
                None,
            )
        else:
            app.dependency_overrides[get_db] = (
                original_override
            )

    assert response.status_code == 503

    detail = response.json()["detail"]

    assert detail["status"] == "not_ready"
    assert detail["database"] == (
        "unavailable"
    )