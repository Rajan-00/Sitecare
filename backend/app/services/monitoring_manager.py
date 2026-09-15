from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
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
    )

    database.add(monitor_check)
    database.commit()
    database.refresh(monitor_check)

    return monitor_check
