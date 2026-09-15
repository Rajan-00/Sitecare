from datetime import datetime

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_websites: int
    active_websites: int
    websites_up: int
    websites_down: int
    websites_not_checked: int
    total_checks: int
    total_incidents: int
    overall_uptime_percentage: float
    average_response_time_ms: float | None


class WebsiteMetricResponse(BaseModel):
    website_id: int
    website_name: str
    website_url: str
    is_active: bool
    current_status: str
    health_score: float
    uptime_percentage: float
    average_response_time_ms: float | None
    total_checks: int
    successful_checks: int
    failed_checks: int
    latest_status_code: int | None
    last_checked_at: datetime | None
