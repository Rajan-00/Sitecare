import asyncio
import logging
import smtplib
import ssl
import certifi  # add with the other imports
from email.message import EmailMessage

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.monitor_check import MonitorCheck
from app.models.notification_preference import (
    NotificationPreference,
)
from app.models.website import Website

logger = logging.getLogger(__name__)


def send_email_sync(
    recipient: str,
    subject: str,
    body: str,
) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(body)

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port,
        timeout=15,
    ) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls(
    context=ssl.create_default_context(cafile=certifi.where())
)

        if settings.smtp_username and settings.smtp_password:
            smtp.login(
                settings.smtp_username,
                settings.smtp_password,
            )

        smtp.send_message(message)


def build_downtime_message(
    website: Website,
    check: MonitorCheck,
) -> tuple[str, str]:
    subject = f"[SiteCare Alert] {website.name} is down"

    reason = check.error_message or (
        f"HTTP status: {check.status_code}"
        if check.status_code is not None
        else "Website could not be reached."
    )

    body = f"""SiteCare AI detected a website failure.

Website: {website.name}
URL: {website.url}
Status: Down
Reason: {reason}
Response time: {check.response_time_ms or "Unavailable"} ms
Detected at: {check.checked_at.isoformat()}

SiteCare AI Website Health Monitoring
"""

    return subject, body


def build_recovery_message(
    website: Website,
    check: MonitorCheck,
) -> tuple[str, str]:
    subject = f"[SiteCare Recovery] {website.name} is operational"

    body = f"""SiteCare AI detected that the website has recovered.

Website: {website.name}
URL: {website.url}
Status: Operational
HTTP status: {check.status_code}
Response time: {check.response_time_ms} ms
Recovered at: {check.checked_at.isoformat()}

SiteCare AI Website Health Monitoring
"""

    return subject, body


def build_anomaly_message(
    website: Website,
    check: MonitorCheck,
) -> tuple[str, str]:
    subject = f"[SiteCare AI] Performance anomaly detected for {website.name}"

    body = f"""SiteCare AI detected unusual website performance.

Website: {website.name}
URL: {website.url}
Response time: {check.response_time_ms} ms
Model score: {check.anomaly_score}
Explanation: {check.anomaly_reason}
Detected at: {check.checked_at.isoformat()}

SiteCare AI Anomaly Detection
"""

    return subject, body


async def send_monitoring_notification(
    database: Session,
    website: Website,
    check: MonitorCheck,
    incident_event: str | None,
) -> None:

    if website.user_id is None:
        return
    preference = database.scalar(
        select(NotificationPreference).where(NotificationPreference.user_id == website.user_id)
    )
    if preference is None or not preference.is_enabled or not settings.smtp_configured:
        return

    message: tuple[str, str] | None = None

    if incident_event == "opened" and preference.notify_on_downtime:
        message = build_downtime_message(
            website,
            check,
        )

    elif incident_event == "resolved" and preference.notify_on_recovery:
        message = build_recovery_message(
            website,
            check,
        )

    elif check.is_anomaly and preference.notify_on_anomaly:
        message = build_anomaly_message(
            website,
            check,
        )

    if message is None:
        return

    subject, body = message

    try:
        await asyncio.to_thread(
            send_email_sync,
            preference.email_address,
            subject,
            body,
        )

        logger.info(
            "Notification sent to %s for %s.",
            preference.email_address,
            website.name,
        )
    except Exception:
        logger.exception(
            "Unable to send notification for %s.",
            website.name,
        )
