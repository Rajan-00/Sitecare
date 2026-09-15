from fastapi.testclient import TestClient

from app.services.website_monitor import CheckResult


def create_test_website(client: TestClient) -> int:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Monitored Website",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201
    return response.json()["id"]


def test_run_successful_website_check(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_test_website(client)

    async def fake_check_website(url: str) -> CheckResult:
        return CheckResult(
            status_code=200,
            response_time_ms=125.5,
            is_up=True,
            error_message=None,
            checked_url=url,
        )

    monkeypatch.setattr(
        "app.api.routes.monitoring.check_website",
        fake_check_website,
    )

    response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    assert response.status_code == 201
    assert response.json()["is_up"] is True
    assert response.json()["status_code"] == 200
    assert response.json()["response_time_ms"] == 125.5

    history_response = client.get(f"/api/v1/monitoring/websites/{website_id}/checks")

    assert history_response.status_code == 200
    assert len(history_response.json()) == 1


def test_website_status_before_first_check(
    client: TestClient,
) -> None:
    website_id = create_test_website(client)

    response = client.get(f"/api/v1/monitoring/websites/{website_id}/status")

    assert response.status_code == 200
    assert response.json()["current_status"] == "not_checked"
    assert response.json()["latest_check"] is None


def test_missing_website_returns_not_found(
    client: TestClient,
) -> None:
    response = client.post("/api/v1/monitoring/websites/999/check")

    assert response.status_code == 404
