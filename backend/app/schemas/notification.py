from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
)


class NotificationPreferenceUpdate(BaseModel):
    email_address: EmailStr
    is_enabled: bool = True
    notify_on_downtime: bool = True
    notify_on_recovery: bool = True
    notify_on_anomaly: bool = True


class NotificationPreferenceResponse(BaseModel):
    id: int
    email_address: EmailStr
    is_enabled: bool
    notify_on_downtime: bool
    notify_on_recovery: bool
    notify_on_anomaly: bool
    smtp_configured: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
