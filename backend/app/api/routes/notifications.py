from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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


def build_response(
    preference: NotificationPreference,
) -> NotificationPreferenceResponse:
    return NotificationPreferenceResponse(
        id=preference.id,
        email_address=preference.email_address,
        is_enabled=preference.is_enabled,
        notify_on_downtime=(preference.notify_on_downtime),
        notify_on_recovery=(preference.notify_on_recovery),
        notify_on_anomaly=(preference.notify_on_anomaly),
        smtp_configured=settings.smtp_configured,
        created_at=preference.created_at,
        updated_at=preference.updated_at,
    )


@router.get(
    "/settings",
    response_model=NotificationPreferenceResponse,
)
def get_notification_settings(
    database: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    preference = database.get(
        NotificationPreference,
        1,
    )

    if preference is None:
        preference = NotificationPreference(
            id=1,
            email_address="admin@example.com",
        )

        database.add(preference)
        database.commit()
        database.refresh(preference)

    return build_response(preference)


@router.put(
    "/settings",
    response_model=NotificationPreferenceResponse,
)
def update_notification_settings(
    payload: NotificationPreferenceUpdate,
    database: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    preference = database.get(
        NotificationPreference,
        1,
    )

    if preference is None:
        preference = NotificationPreference(
            id=1,
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
