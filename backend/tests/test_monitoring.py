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
        "app.services.monitoring_manager.check_website",
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


def test_blocked_and_timeout_checks_do_not_claim_outage(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_test_website(client)
    results = [
        CheckResult(403, 47.0, False, None, "https://example.com/"),
        CheckResult(None, 10030.0, False, "The website request timed out.", "https://example.com"),
    ]

    async def next_check(url: str) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr("app.services.monitoring_manager.check_website", next_check)

    first = client.post(f"/api/v1/monitoring/websites/{website_id}/check")
    second = client.post(f"/api/v1/monitoring/websites/{website_id}/check")
    assert first.json()["outcome"] == "blocked"
    assert second.json()["outcome"] == "unknown"

    history = client.get(f"/api/v1/monitoring/websites/{website_id}/checks").json()
    assert [check["outcome"] for check in history] == ["unknown", "blocked"]
    assert client.get(f"/api/v1/monitoring/websites/{website_id}/status").json()[
        "current_status"
    ] == "unknown"

    website = client.get("/api/v1/dashboard/websites").json()[0]
    assert website["current_status"] == "unknown"
    assert website["uptime_percentage"] is None
    assert website["health_score"] is None
    assert website["failed_checks"] == 0
    assert website["average_response_time_ms"] is None
    assert client.get("/api/v1/dashboard/summary").json()["websites_down"] == 0
    assert client.get(f"/api/v1/incidents?website_id={website_id}").json() == []


def test_blocked_check_does_not_change_confirmed_uptime(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_test_website(client)
    results = [
        CheckResult(200, 250.0, True, None, "https://example.com/"),
        CheckResult(403, 47.0, False, None, "https://example.com/"),
    ]

    async def next_check(url: str) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr("app.services.monitoring_manager.check_website", next_check)
    for _ in range(2):
        assert client.post(f"/api/v1/monitoring/websites/{website_id}/check").status_code == 201

    website = client.get("/api/v1/dashboard/websites").json()[0]
    assert website["current_status"] == "blocked"
    assert website["uptime_percentage"] == 100.0
    assert website["average_response_time_ms"] == 250.0
    assert website["failed_checks"] == 0
