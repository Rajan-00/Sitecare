from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.anomaly_detector import (
    detect_check_anomaly,
)
from app.services.incident_manager import (
    update_incident_state,
)
from app.services.notification_service import (
    send_monitoring_notification,
)
from app.services.website_monitor import check_website


async def perform_and_store_check(
    database: Session,
    website: Website,
) -> MonitorCheck:
    result = await check_website(website.url)

    monitor_check = MonitorCheck(
        website_id=website.id,
        status_code=result.status_code,
        response_time_ms=result.response_time_ms,
        is_up=result.is_up,
        error_message=result.error_message,
        checked_url=result.checked_url,
        checked_at=datetime.now(UTC),
    )

    try:
        database.add(monitor_check)
        database.flush()

        anomaly_result = detect_check_anomaly(
            database,
            monitor_check,
        )

        monitor_check.is_anomaly = anomaly_result.is_anomaly
        monitor_check.anomaly_score = anomaly_result.anomaly_score
        monitor_check.anomaly_reason = anomaly_result.anomaly_reason

        incident_result = update_incident_state(
            database,
            website,
            monitor_check,
        )

        database.commit()
        database.refresh(monitor_check)
    except Exception:
        database.rollback()
        raise

    await send_monitoring_notification(
        database=database,
        website=website,
        check=monitor_check,
        incident_event=incident_result.event,
    )

    return monitor_check
