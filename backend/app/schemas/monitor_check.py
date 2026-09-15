from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MonitorCheckResponse(BaseModel):
    id: int
    website_id: int
    status_code: int | None
    response_time_ms: float | None
    is_up: bool
    error_message: str | None
    checked_url: str
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebsiteStatusResponse(BaseModel):
    website_id: int
    website_name: str
    website_url: str
    current_status: str
    latest_check: MonitorCheckResponse | None
