from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ProfileUpdate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str = Field(
        min_length=8,
        max_length=128,
    )
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


class MessageResponse(BaseModel):
    message: str


class AccountStatisticsResponse(BaseModel):
    total_websites: int
    active_websites: int
    total_health_checks: int
    total_incidents: int
    total_activities: int
    last_activity_at: datetime | None
