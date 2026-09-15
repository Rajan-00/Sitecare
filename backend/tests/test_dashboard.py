from fastapi.testclient import TestClient

from app.services.website_monitor import CheckResult


def create_website(
    client: TestClient,
    name: str,
    url: str,
) -> int:
    response = client.post(
        "/api/v1/websites",
        json={
            "name": name,
            "url": url,
            "check_interval_minutes": 5,
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_empty_dashboard_summary(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/dashboard/summary")

    assert response.status_code == 200

    data = response.json()

    assert data["total_websites"] == 0
    assert data["active_websites"] == 0
    assert data["websites_up"] == 0
    assert data["websites_down"] == 0
    assert data["websites_not_checked"] == 0
    assert data["total_checks"] == 0
    assert data["total_incidents"] == 0
    assert data["overall_uptime_percentage"] == 0.0
    assert data["average_response_time_ms"] is None


def test_dashboard_with_successful_check(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(
        client,
        "Example",
        "https://example.com",
    )

    async def fake_successful_check(
        url: str,
    ) -> CheckResult:
        return CheckResult(
            status_code=200,
            response_time_ms=250.0,
            is_up=True,
            error_message=None,
            checked_url=url,
        )

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        fake_successful_check,
    )

    check_response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    assert check_response.status_code == 201

    summary_response = client.get("/api/v1/dashboard/summary")

    assert summary_response.status_code == 200

    summary = summary_response.json()

    assert summary["total_websites"] == 1
    assert summary["active_websites"] == 1
    assert summary["websites_up"] == 1
    assert summary["websites_down"] == 0
    assert summary["total_checks"] == 1
    assert summary["overall_uptime_percentage"] == 100.0
    assert summary["average_response_time_ms"] == 250.0


def test_dashboard_website_metrics(
    client: TestClient,
    monkeypatch,
) -> None:
    website_id = create_website(
        client,
        "Monitored Website",
        "https://example.com",
    )

    results = [
        CheckResult(
            status_code=200,
            response_time_ms=200.0,
            is_up=True,
            error_message=None,
            checked_url="https://example.com/",
        ),
        CheckResult(
            status_code=503,
            response_time_ms=800.0,
            is_up=False,
            error_message=None,
            checked_url="https://example.com/",
        ),
    ]

    async def fake_check(
        url: str,
    ) -> CheckResult:
        return results.pop(0)

    monkeypatch.setattr(
        "app.services.monitoring_manager.check_website",
        fake_check,
    )

    first_response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")
    second_response = client.post(f"/api/v1/monitoring/websites/{website_id}/check")

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get("/api/v1/dashboard/websites")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1

    website = data[0]

    assert website["website_id"] == website_id
    assert website["current_status"] == "down"
    assert website["uptime_percentage"] == 50.0
    assert website["average_response_time_ms"] == 500.0
    assert website["total_checks"] == 2
    assert website["successful_checks"] == 1
    assert website["failed_checks"] == 1
    assert website["latest_status_code"] == 503
    assert website["health_score"] == 65.0


def test_not_checked_website_metrics(
    client: TestClient,
) -> None:
    create_website(
        client,
        "Unchecked Website",
        "https://example.com",
    )

    response = client.get("/api/v1/dashboard/websites")

    assert response.status_code == 200

    website = response.json()[0]

    assert website["current_status"] == "not_checked"
    assert website["health_score"] == 0.0
    assert website["uptime_percentage"] == 0.0
    assert website["total_checks"] == 0
    assert website["last_checked_at"] is None
