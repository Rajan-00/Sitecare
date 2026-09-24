from fastapi.testclient import TestClient

from app.services.website_monitor import CheckResult


def create_website(
    client: TestClient,
    name: str = "Incident Test",
) -> int:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": name,
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
    website_id = create_website(
        client,
        name="College Portal",
    )

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

    response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )

    assert response.status_code == 201

    incident_response = client.get(
        f"/api/v1/incidents?website_id={website_id}",
    )

    assert incident_response.status_code == 200

    incidents = incident_response.json()

    assert len(incidents) == 1

    incident = incidents[0]

    assert incident["website_id"] == website_id
    assert incident["website_name"] == "College Portal"
    assert incident["website_url"] == "https://example.com/"
    assert incident["is_resolved"] is False
    assert incident["severity"] == "critical"
    assert incident["failure_count"] == 1
    assert incident["first_status_code"] == 503


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

    first_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )
    second_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get(
        f"/api/v1/incidents?website_id={website_id}",
    )

    assert response.status_code == 200

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

    failed_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )
    recovered_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )

    assert failed_response.status_code == 201
    assert recovered_response.status_code == 201

    response = client.get(
        f"/api/v1/incidents?website_id={website_id}",
    )

    assert response.status_code == 200

    incident = response.json()[0]

    assert incident["website_name"] == "Incident Test"
    assert incident["is_resolved"] is True
    assert incident["resolved_at"] is not None
    assert incident["duration_seconds"] is not None


def test_incident_status_filter(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(client)

    async def failed_check(
        url: str,
    ) -> CheckResult:
        return CheckResult(
            status_code=500,
            response_time_ms=750.0,
            is_up=False,
            error_message="Internal server error",
            checked_url=url,
        )

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        failed_check,
    )

    check_response = client.post(
        f"/api/v1/monitoring/websites/{website_id}/check",
    )

    assert check_response.status_code == 201

    open_response = client.get(
        "/api/v1/incidents?resolved=false",
    )
    resolved_response = client.get(
        "/api/v1/incidents?resolved=true",
    )

    assert open_response.status_code == 200
    assert resolved_response.status_code == 200

    assert len(open_response.json()) == 1
    assert len(resolved_response.json()) == 0


def test_incident_limit_validation(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/incidents?limit=501",
    )

    assert response.status_code == 422


def test_inconclusive_probe_does_not_resolve_confirmed_incident(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(client)
    results = [
        CheckResult(503, 700.0, False, None, "https://example.com/"),
        CheckResult(None, 10000.0, False, "The website request timed out.", "https://example.com/"),
        CheckResult(200, 200.0, True, None, "https://example.com/"),
    ]

    async def next_check(url: str) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr("app.services.monitoring_manager.check_website", next_check)
    endpoint = f"/api/v1/monitoring/websites/{website_id}/check"
    assert client.post(endpoint).status_code == 201
    assert client.post(endpoint).status_code == 201
    incidents = client.get(f"/api/v1/incidents?website_id={website_id}").json()
    assert incidents[0]["is_resolved"] is False
    assert incidents[0]["failure_count"] == 1

    assert client.post(endpoint).status_code == 201
    incidents = client.get(f"/api/v1/incidents?website_id={website_id}").json()
    assert incidents[0]["is_resolved"] is True
