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

    response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check"
    )

    assert response.status_code == 201
    assert response.json()["is_up"] is True
    assert response.json()["outcome"] == "up"
    assert response.json()["status_code"] == 200
    assert response.json()["response_time_ms"] == 125.5

    history_response = client.get(
        f"/api/v1/monitoring/websites/{website_id}/checks"
    )

    assert history_response.status_code == 200
    assert len(history_response.json()) == 1


def test_website_status_before_first_check(
    client: TestClient,
) -> None:
    website_id = create_test_website(client)

    response = client.get(
        f"/api/v1/monitoring/websites/{website_id}/status"
    )

    assert response.status_code == 200
    assert response.json()["current_status"] == "not_checked"
    assert response.json()["latest_check"] is None


def test_missing_website_returns_not_found(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/monitoring/websites/999/check"
    )

    assert response.status_code == 404


def test_blocked_check_opens_incident_and_timeout_leaves_it_unchanged(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_test_website(client)

    results = [
        CheckResult(
            status_code=403,
            response_time_ms=47.0,
            is_up=False,
            error_message=None,
            checked_url="https://example.com/",
        ),
        CheckResult(
            status_code=None,
            response_time_ms=10030.0,
            is_up=False,
            error_message="The website request timed out.",
            checked_url="https://example.com",
        ),
    ]

    async def next_check(url: str) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        next_check,
    )

    first_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check"
    )

    assert first_response.status_code == 201
    assert first_response.json()["outcome"] == "down"

    incidents_response = client.get(
        f"/api/v1/incidents?website_id={website_id}"
    )

    assert incidents_response.status_code == 200

    incidents_before_timeout = incidents_response.json()
    assert len(incidents_before_timeout) == 1

    second_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check"
    )

    assert second_response.status_code == 201
    assert second_response.json()["outcome"] == "unknown"

    history_response = client.get(
        f"/api/v1/monitoring/websites/{website_id}/checks"
    )

    assert history_response.status_code == 200
    assert [
        check["outcome"]
        for check in history_response.json()
    ] == ["unknown", "down"]

    status_response = client.get(
        f"/api/v1/monitoring/websites/{website_id}/status"
    )

    assert status_response.status_code == 200
    assert status_response.json()["current_status"] == "unknown"

    dashboard_response = client.get(
        "/api/v1/dashboard/websites"
    )

    assert dashboard_response.status_code == 200
    assert len(dashboard_response.json()) == 1

    website = dashboard_response.json()[0]

    assert website["current_status"] == "unknown"
    assert website["uptime_percentage"] == 0.0
    assert website["failed_checks"] == 1

    incidents_after_timeout_response = client.get(
        f"/api/v1/incidents?website_id={website_id}"
    )

    assert incidents_after_timeout_response.status_code == 200
    assert (
        incidents_after_timeout_response.json()
        == incidents_before_timeout
    )


def test_blocked_check_counts_as_downtime(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_test_website(client)

    results = [
        CheckResult(
            status_code=200,
            response_time_ms=250.0,
            is_up=True,
            error_message=None,
            checked_url="https://example.com/",
        ),
        CheckResult(
            status_code=403,
            response_time_ms=47.0,
            is_up=False,
            error_message=None,
            checked_url="https://example.com/",
        ),
    ]

    async def next_check(url: str) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        next_check,
    )

    for expected_outcome in ("up", "down"):
        response = client.post(
            f"/api/v1/monitoring/websites/{website_id}/check"
        )

        assert response.status_code == 201
        assert response.json()["outcome"] == expected_outcome

    dashboard_response = client.get(
        "/api/v1/dashboard/websites"
    )

    assert dashboard_response.status_code == 200
    assert len(dashboard_response.json()) == 1

    website = dashboard_response.json()[0]

    assert website["current_status"] == "down"
    assert website["uptime_percentage"] == 50.0
    assert website["failed_checks"] == 1

    summary_response = client.get(
        "/api/v1/dashboard/summary"
    )

    assert summary_response.status_code == 200
    assert summary_response.json()["websites_down"] == 1

    incidents_response = client.get(
        f"/api/v1/incidents?website_id={website_id}"
    )

    assert incidents_response.status_code == 200
    assert len(incidents_response.json()) == 1