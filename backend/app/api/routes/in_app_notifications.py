from datetime import UTC, datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_database
from app.models.in_app_notification import InAppNotification
from app.models.user import User
from app.schemas.in_app_notification import (
    InAppNotificationListResponse,
    InAppNotificationResponse,
    NotificationMessageResponse,
    UnreadCountResponse,
)

router = APIRouter(
    prefix="/notifications/in-app",
    tags=["In-App Notifications"],
)


def get_owned_notification(
    database: Session,
    current_user: User,
    notification_id: int,
) -> InAppNotification:
    notification = database.scalar(
        select(InAppNotification).where(
            InAppNotification.id == notification_id,
            InAppNotification.user_id == current_user.id,
        )
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    return notification


@router.get(
    "",
    response_model=InAppNotificationListResponse,
)
def list_in_app_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread_only: bool = Query(default=False),
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
    notification_type: str | None = Query(default=None),
) -> InAppNotificationListResponse:
    conditions = [InAppNotification.user_id == current_user.id]

    if unread_only:
        conditions.append(InAppNotification.is_read.is_(False))

    if notification_type:
        conditions.append(InAppNotification.notification_type == notification_type)

    total = database.scalar(select(func.count(InAppNotification.id)).where(*conditions))

    unread_count = database.scalar(
        select(func.count(InAppNotification.id)).where(
            InAppNotification.user_id == current_user.id,
            InAppNotification.is_read.is_(False),
        )
    )

    notifications = database.scalars(
        select(InAppNotification)
        .where(*conditions)
        .order_by(
            InAppNotification.created_at.desc(),
            InAppNotification.id.desc(),
        )
        .limit(limit)
        .offset(offset)
    ).all()

    return InAppNotificationListResponse(
        items=[
            InAppNotificationResponse.model_validate(notification) for notification in notifications
        ],
        total=total or 0,
        unread_count=unread_count or 0,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
)
def get_unread_notification_count(
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
) -> UnreadCountResponse:
    unread_count = database.scalar(
        select(func.count(InAppNotification.id)).where(
            InAppNotification.user_id == current_user.id,
            InAppNotification.is_read.is_(False),
        )
    )

    return UnreadCountResponse(unread_count=unread_count or 0)


@router.patch(
    "/read-all",
    response_model=NotificationMessageResponse,
)
def mark_all_notifications_as_read(
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
) -> NotificationMessageResponse:
    current_time = datetime.now(UTC)

    database.execute(
        update(InAppNotification)
        .where(
            InAppNotification.user_id == current_user.id,
            InAppNotification.is_read.is_(False),
        )
        .values(
            is_read=True,
            read_at=current_time,
        )
    )

    database.commit()

    return NotificationMessageResponse(message="All notifications marked as read.")


@router.patch(
    "/{notification_id}/read",
    response_model=InAppNotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
) -> InAppNotification:
    notification = get_owned_notification(
        database=database,
        current_user=current_user,
        notification_id=notification_id,
    )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(UTC)

        database.commit()
        database.refresh(notification)

    return notification
