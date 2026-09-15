from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website


def create_report_data(
    database: Session,
) -> Website:
    website = Website(
        name="Report Website",
        url="https://example.com/",
        check_interval_minutes=5,
        is_active=True,
    )

    database.add(website)
    database.flush()

    check = MonitorCheck(
        website_id=website.id,
        status_code=200,
        response_time_ms=150.0,
        is_up=True,
        error_message=None,
        checked_url=website.url,
        is_anomaly=False,
        anomaly_score=0.1,
        anomaly_reason=None,
        checked_at=datetime.now(UTC),
    )

    database.add(check)
    database.commit()
    database.refresh(website)

    return website


def test_download_pdf_report(
    client: TestClient,
    database: Session,
) -> None:
    website = create_report_data(database)

    response = client.get(f"/api/v1/reports/websites/{website.id}/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_download_csv_report(
    client: TestClient,
    database: Session,
) -> None:
    website = create_report_data(database)

    response = client.get(f"/api/v1/reports/websites/{website.id}/csv")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")

    content = response.content.decode("utf-8-sig")

    assert "Website Name" in content
    assert "Report Website" in content
    assert "Operational" in content


def test_report_for_missing_website(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/reports/websites/999/pdf")

    assert response.status_code == 404
