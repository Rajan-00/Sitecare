from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")

    data = response.json()

    assert isinstance(data, dict)
    assert len(data) > 0


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "sitecare-ai-api"
    assert "timestamp" in data


def test_health_timestamp_is_not_empty(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/health")

    timestamp = response.json()["timestamp"]

    assert isinstance(timestamp, str)
    assert len(timestamp) > 0
