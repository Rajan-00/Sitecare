from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InAppNotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    resource_type: str | None
    resource_id: int | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class InAppNotificationListResponse(BaseModel):
    items: list[InAppNotificationResponse]
    total: int
    unread_count: int
    read_count: int
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)


class UnreadCountResponse(BaseModel):
    unread_count: int


class NotificationMessageResponse(BaseModel):
    message: str


class DeletedNotificationsResponse(BaseModel):
    deleted_count: int
