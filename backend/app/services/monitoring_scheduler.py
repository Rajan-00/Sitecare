import logging
from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.monitoring_manager import perform_and_store_check

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


def make_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def is_check_due(
    website: Website,
    latest_check: MonitorCheck | None,
    current_time: datetime,
) -> bool:
    if latest_check is None:
        return True

    checked_at = make_utc(latest_check.checked_at)
    next_check_at = checked_at + timedelta(minutes=website.check_interval_minutes)

    return current_time >= next_check_at


async def run_due_monitoring_checks() -> None:
    logger.info("Looking for websites that require monitoring.")

    with SessionLocal() as database:
        statement = select(Website).where(Website.is_active.is_(True)).order_by(Website.id)

        websites = list(database.scalars(statement).all())
        current_time = datetime.now(UTC)

        for website in websites:
            latest_statement = (
                select(MonitorCheck)
                .where(MonitorCheck.website_id == website.id)
                .order_by(MonitorCheck.checked_at.desc())
                .limit(1)
            )

            latest_check = database.scalar(latest_statement)

            if not is_check_due(
                website,
                latest_check,
                current_time,
            ):
                continue

            try:
                result = await perform_and_store_check(
                    database,
                    website,
                )

                logger.info(
                    "Checked %s: is_up=%s status_code=%s response_time=%s",
                    website.url,
                    result.is_up,
                    result.status_code,
                    result.response_time_ms,
                )
            except Exception:
                database.rollback()

                logger.exception(
                    "Scheduled check failed for website ID %s.",
                    website.id,
                )


def start_monitoring_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        run_due_monitoring_checks,
        trigger=IntervalTrigger(seconds=settings.scheduler_interval_seconds),
        id="sitecare-monitoring-job",
        name="SiteCare automatic website monitoring",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    logger.info("SiteCare monitoring scheduler started.")


def stop_monitoring_scheduler() -> None:
    if not scheduler.running:
        return

    scheduler.shutdown(wait=False)
    logger.info("SiteCare monitoring scheduler stopped.")
