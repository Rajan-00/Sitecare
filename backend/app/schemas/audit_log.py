from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: str | None
    resource_id: int | None
    description: str
    details_json: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)
