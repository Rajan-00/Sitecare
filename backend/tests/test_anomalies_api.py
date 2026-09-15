from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website


def test_list_anomalies(
    client: TestClient,
    database: Session,
) -> None:
    website = Website(
        name="Anomaly Test",
        url="https://example.com/",
        check_interval_minutes=5,
        is_active=True,
        user_id=999,
    )

    database.add(website)
    database.flush()

    anomaly = MonitorCheck(
        website_id=website.id,
        status_code=200,
        response_time_ms=3000.0,
        is_up=True,
        error_message=None,
        checked_url=website.url,
        is_anomaly=True,
        anomaly_score=-0.15,
        anomaly_reason=("Response time is unusually slow."),
        checked_at=datetime.now(UTC),
    )

    database.add(anomaly)
    database.commit()

    response = client.get(f"/api/v1/anomalies?website_id={website.id}")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["is_anomaly"] is True
    assert data[0]["response_time_ms"] == 3000.0
    assert data[0]["anomaly_score"] == -0.15
