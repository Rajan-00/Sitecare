from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IncidentResponse(BaseModel):
    id: int
    website_id: int
    website_name: str
    website_url: str
    severity: str
    cause: str | None
    first_status_code: int | None
    latest_status_code: int | None
    failure_count: int
    is_resolved: bool
    started_at: datetime
    resolved_at: datetime | None
    duration_seconds: float | None

    model_config = ConfigDict(from_attributes=True)