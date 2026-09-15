from datetime import UTC, datetime, timedelta

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.monitoring_scheduler import is_check_due


def create_website(interval: int = 5) -> Website:
    return Website(
        id=1,
        name="Test Website",
        url="https://example.com/",
        check_interval_minutes=interval,
        is_active=True,
    )


def test_website_without_history_is_due() -> None:
    website = create_website()
    current_time = datetime.now(UTC)

    assert is_check_due(
        website,
        latest_check=None,
        current_time=current_time,
    )


def test_recently_checked_website_is_not_due() -> None:
    website = create_website(interval=5)
    current_time = datetime.now(UTC)

    latest_check = MonitorCheck(
        website_id=website.id,
        status_code=200,
        response_time_ms=120.0,
        is_up=True,
        error_message=None,
        checked_url=website.url,
        checked_at=current_time - timedelta(minutes=2),
    )

    assert not is_check_due(
        website,
        latest_check,
        current_time,
    )


def test_old_check_is_due() -> None:
    website = create_website(interval=5)
    current_time = datetime.now(UTC)

    latest_check = MonitorCheck(
        website_id=website.id,
        status_code=200,
        response_time_ms=120.0,
        is_up=True,
        error_message=None,
        checked_url=website.url,
        checked_at=current_time - timedelta(minutes=6),
    )

    assert is_check_due(
        website,
        latest_check,
        current_time,
    )
