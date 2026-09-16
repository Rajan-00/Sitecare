from sqlalchemy.orm import Session

from app.models.website import Website
from app.services.in_app_notifications import (
    create_in_app_notification,
)


def notify_incident_started(
    database: Session,
    *,
    website: Website,
    incident_id: int,
    status_code: int | None = None,
    error_message: str | None = None,
) -> None:
    if website.user_id is None:
        return

    reason = error_message

    if reason is None and status_code is not None:
        reason = f"HTTP status code {status_code}"

    if reason is None:
        reason = "The website did not respond successfully."

    create_in_app_notification(
        database,
        user_id=website.user_id,
        title=f"{website.name} is down",
        message=(f"SiteCare detected an incident for {website.name}. Reason: {reason}"),
        notification_type="incident",
        resource_type="incident",
        resource_id=incident_id,
    )


def notify_website_recovered(
    database: Session,
    *,
    website: Website,
    incident_id: int,
    response_time_ms: float | None = None,
) -> None:
    if website.user_id is None:
        return

    if response_time_ms is not None:
        message = (
            f"{website.name} has recovered and is responding "
            f"normally again. Current response time: "
            f"{response_time_ms:.0f} ms."
        )
    else:
        message = f"{website.name} has recovered and is responding normally again."

    create_in_app_notification(
        database,
        user_id=website.user_id,
        title=f"{website.name} recovered",
        message=message,
        notification_type="recovery",
        resource_type="incident",
        resource_id=incident_id,
    )


def notify_anomaly_detected(
    database: Session,
    *,
    website: Website,
    anomaly_id: int,
    response_time_ms: float | None = None,
    anomaly_score: float | None = None,
) -> None:
    if website.user_id is None:
        return

    details: list[str] = []

    if response_time_ms is not None:
        details.append(f"response time {response_time_ms:.0f} ms")

    if anomaly_score is not None:
        details.append(f"anomaly score {anomaly_score:.2f}")

    detail_text = ", ".join(details)

    if detail_text:
        message = f"SiteCare AI detected unusual behavior for {website.name}: {detail_text}."
    else:
        message = f"SiteCare AI detected unusual behavior for {website.name}."

    create_in_app_notification(
        database,
        user_id=website.user_id,
        title=f"Anomaly detected on {website.name}",
        message=message,
        notification_type="anomaly",
        resource_type="website",
        resource_id=website.id,
    )
