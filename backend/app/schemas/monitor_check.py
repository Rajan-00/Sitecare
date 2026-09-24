from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field

from app.services.check_outcome import check_outcome


class MonitorCheckResponse(BaseModel):
    id: int
    website_id: int
    status_code: int | None
    response_time_ms: float | None
    is_up: bool
    error_message: str | None
    checked_url: str
    is_anomaly: bool
    anomaly_score: float | None
    anomaly_reason: str | None
    checked_at: datetime

    @computed_field
    @property
    def outcome(self) -> str:
        return check_outcome(self)

    model_config = ConfigDict(from_attributes=True)


class WebsiteStatusResponse(BaseModel):
    website_id: int
    website_name: str
    website_url: str
    current_status: str
    latest_check: MonitorCheckResponse | None
