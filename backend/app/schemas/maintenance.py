from pydantic import BaseModel


class MaintenancePredictionResponse(BaseModel):
    website_id: int
    website_name: str
    website_url: str
    prediction_status: str
    risk_level: str
    risk_score: float
    confidence_percentage: float
    sample_count: int
    current_average_response_time_ms: float | None
    predicted_response_time_ms: float | None
    response_time_trend_ms: float | None
    failure_rate_percentage: float
    anomaly_rate_percentage: float
    recommendation: str
