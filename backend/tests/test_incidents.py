from fastapi.testclient import TestClient

from app.services.website_monitor import CheckResult


def create_website(client: TestClient) -> int:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": "Incident Test",
            "url": "https://example.com",
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_failure_creates_incident(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(client)

    async def failed_check(
        url: str,
    ) -> CheckResult:
        return CheckResult(
            status_code=503,
            response_time_ms=900.0,
            is_up=False,
            error_message=None,
            checked_url=url,
        )

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        failed_check,
    )

    response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    assert response.status_code == 201

    incident_response = client.get(f"/api/v1/incidents?website_id={website_id}")

    assert incident_response.status_code == 200

    incidents = incident_response.json()

    assert len(incidents) == 1
    assert incidents[0]["is_resolved"] is False
    assert incidents[0]["severity"] == "critical"
    assert incidents[0]["failure_count"] == 1
    assert incidents[0]["first_status_code"] == 503


def test_repeated_failures_use_same_incident(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(client)

    async def failed_check(
        url: str,
    ) -> CheckResult:
        return CheckResult(
            status_code=503,
            response_time_ms=900.0,
            is_up=False,
            error_message=None,
            checked_url=url,
        )

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        failed_check,
    )

    client.post(f"/api/v1/monitoring/websites/{website_id}/check")
    client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    response = client.get(f"/api/v1/incidents?website_id={website_id}")

    incidents = response.json()

    assert len(incidents) == 1
    assert incidents[0]["failure_count"] == 2


def test_successful_check_resolves_incident(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(client)

    results = [
        CheckResult(
            status_code=503,
            response_time_ms=900.0,
            is_up=False,
            error_message=None,
            checked_url="https://example.com/",
        ),
        CheckResult(
            status_code=200,
            response_time_ms=200.0,
            is_up=True,
            error_message=None,
            checked_url="https://example.com/",
        ),
    ]

    async def next_check(
        url: str,
    ) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        next_check,
    )

    client.post(f"/api/v1/monitoring/websites/{website_id}/check")
    client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    response = client.get(f"/api/v1/incidents?website_id={website_id}")

    incident = response.json()[0]

    assert incident["is_resolved"] is True
    assert incident["resolved_at"] is not None
    assert incident["duration_seconds"] is not None
