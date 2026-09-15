from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.core.config import settings
from app.db.session import get_db
from app.models.notification_preference import (
    NotificationPreference,
)
from app.schemas.notification import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)

router = APIRouter()


def get_user_preference(
    database: Session,
    user_id: int,
) -> NotificationPreference | None:
    return database.scalar(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )


def build_response(
    preference: NotificationPreference,
) -> NotificationPreferenceResponse:
    return NotificationPreferenceResponse(
        id=preference.id,
        email_address=(preference.email_address),
        is_enabled=preference.is_enabled,
        notify_on_downtime=(preference.notify_on_downtime),
        notify_on_recovery=(preference.notify_on_recovery),
        notify_on_anomaly=(preference.notify_on_anomaly),
        smtp_configured=(settings.smtp_configured),
        created_at=preference.created_at,
        updated_at=preference.updated_at,
    )


@router.get(
    "/settings",
    response_model=(NotificationPreferenceResponse),
)
def get_notification_settings(
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    preference = get_user_preference(
        database,
        current_user.id,
    )

    if preference is None:
        preference = NotificationPreference(
            user_id=current_user.id,
            email_address=current_user.email,
        )

        database.add(preference)
        database.commit()
        database.refresh(preference)

    return build_response(preference)


@router.put(
    "/settings",
    response_model=(NotificationPreferenceResponse),
)
def update_notification_settings(
    payload: NotificationPreferenceUpdate,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    preference = get_user_preference(
        database,
        current_user.id,
    )

    if preference is None:
        preference = NotificationPreference(
            user_id=current_user.id,
            email_address=str(payload.email_address),
        )

        database.add(preference)

    preference.email_address = str(payload.email_address)
    preference.is_enabled = payload.is_enabled
    preference.notify_on_downtime = payload.notify_on_downtime
    preference.notify_on_recovery = payload.notify_on_recovery
    preference.notify_on_anomaly = payload.notify_on_anomaly

    database.commit()
    database.refresh(preference)

    return build_response(preference)
