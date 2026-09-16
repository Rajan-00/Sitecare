from sqlalchemy.orm import Session

from app.models.in_app_notification import InAppNotification


def create_in_app_notification(
    database: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    resource_type: str | None = None,
    resource_id: int | None = None,
) -> InAppNotification:
    notification = InAppNotification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        resource_type=resource_type,
        resource_id=resource_id,
        is_read=False,
    )

    database.add(notification)

    return notification
