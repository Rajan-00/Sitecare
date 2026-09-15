from sklearn.linear_model import LinearRegression
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.maintenance import (
    MaintenancePredictionResponse,
)

MINIMUM_PREDICTION_SAMPLES = 10
PREDICTION_HISTORY_LIMIT = 100
PREDICTION_STEPS_AHEAD = 5


def clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(minimum, min(value, maximum))


def determine_risk_level(
    risk_score: float,
) -> str:
    if risk_score >= 80:
        return "critical"

    if risk_score >= 60:
        return "high"

    if risk_score >= 30:
        return "medium"

    return "low"


def build_recommendation(
    risk_level: str,
    trend: float,
    failure_rate: float,
    anomaly_rate: float,
) -> str:
    if risk_level == "critical":
        return (
            "Immediate maintenance is recommended. "
            "Investigate server resources, application "
            "errors, database performance and hosting health."
        )

    if risk_level == "high":
        return (
            "Schedule maintenance soon. Review slow requests, "
            "server load, error logs and recent deployments."
        )

    if risk_level == "medium":
        if failure_rate >= 10:
            return (
                "Monitor closely and investigate recurring "
                "availability failures before they increase."
            )

        if anomaly_rate >= 10:
            return (
                "Review recent response-time anomalies and "
                "identify unusually slow application requests."
            )

        if trend > 0:
            return (
                "Performance is gradually degrading. Review "
                "caching, database queries and server resources."
            )

        return "Continue monitoring. Some health indicators show early signs of maintenance risk."

    return (
        "No immediate maintenance is required. Continue "
        "regular monitoring and preventive maintenance."
    )


def create_learning_prediction(
    website: Website,
    sample_count: int,
    failure_rate: float,
    anomaly_rate: float,
) -> MaintenancePredictionResponse:
    confidence = round(
        min(
            sample_count / MINIMUM_PREDICTION_SAMPLES * 100,
            90,
        ),
        2,
    )

    return MaintenancePredictionResponse(
        website_id=website.id,
        website_name=website.name,
        website_url=website.url,
        prediction_status="learning",
        risk_level="unknown",
        risk_score=0.0,
        confidence_percentage=confidence,
        sample_count=sample_count,
        current_average_response_time_ms=None,
        predicted_response_time_ms=None,
        response_time_trend_ms=None,
        failure_rate_percentage=failure_rate,
        anomaly_rate_percentage=anomaly_rate,
        recommendation=(
            "More monitoring data is required. SiteCare "
            f"needs at least {MINIMUM_PREDICTION_SAMPLES} "
            "successful response-time measurements."
        ),
    )


def calculate_maintenance_prediction(
    website: Website,
    checks: list[MonitorCheck],
) -> MaintenancePredictionResponse:
    total_checks = len(checks)

    if total_checks:
        failure_rate = round(
            sum(not check.is_up for check in checks) / total_checks * 100,
            2,
        )

        anomaly_rate = round(
            sum(check.is_anomaly for check in checks) / total_checks * 100,
            2,
        )
    else:
        failure_rate = 0.0
        anomaly_rate = 0.0

    successful_response_times = [
        float(check.response_time_ms)
        for check in checks
        if (check.is_up and check.response_time_ms is not None)
    ]

    sample_count = len(successful_response_times)

    if sample_count < MINIMUM_PREDICTION_SAMPLES:
        return create_learning_prediction(
            website=website,
            sample_count=sample_count,
            failure_rate=failure_rate,
            anomaly_rate=anomaly_rate,
        )

    features = [[index] for index in range(sample_count)]

    model = LinearRegression()
    model.fit(
        features,
        successful_response_times,
    )

    prediction_index = sample_count + PREDICTION_STEPS_AHEAD - 1

    predicted_response_time = max(
        0.0,
        float(model.predict([[prediction_index]])[0]),
    )

    trend = float(model.coef_[0])

    current_average = sum(successful_response_times) / sample_count

    if current_average > 0:
        predicted_degradation = max(
            0.0,
            (predicted_response_time - current_average) / current_average * 100,
        )
    else:
        predicted_degradation = 0.0

    trend_risk = clamp(predicted_degradation * 5)

    latency_risk = clamp((current_average - 500) / (3000 - 500) * 100)

    risk_score = failure_rate * 0.40 + anomaly_rate * 0.20 + trend_risk * 0.30 + latency_risk * 0.10

    risk_score = round(
        clamp(risk_score),
        2,
    )

    risk_level = determine_risk_level(risk_score)

    model_quality = max(
        0.0,
        float(
            model.score(
                features,
                successful_response_times,
            )
        ),
    )

    sample_confidence = min(
        sample_count / 50,
        1.0,
    )

    confidence = round(
        clamp(sample_confidence * 60 + min(model_quality, 1.0) * 40),
        2,
    )

    return MaintenancePredictionResponse(
        website_id=website.id,
        website_name=website.name,
        website_url=website.url,
        prediction_status="ready",
        risk_level=risk_level,
        risk_score=risk_score,
        confidence_percentage=confidence,
        sample_count=sample_count,
        current_average_response_time_ms=round(
            current_average,
            2,
        ),
        predicted_response_time_ms=round(
            predicted_response_time,
            2,
        ),
        response_time_trend_ms=round(
            trend,
            4,
        ),
        failure_rate_percentage=failure_rate,
        anomaly_rate_percentage=anomaly_rate,
        recommendation=build_recommendation(
            risk_level=risk_level,
            trend=trend,
            failure_rate=failure_rate,
            anomaly_rate=anomaly_rate,
        ),
    )


def build_maintenance_predictions(
    database: Session,
    user_id: int,
) -> list[MaintenancePredictionResponse]:
    websites = list(
        database.scalars(
            select(Website).where(Website.user_id == user_id).order_by(Website.name)
        ).all()
    )

    predictions: list[MaintenancePredictionResponse] = []

    for website in websites:
        statement = (
            select(MonitorCheck)
            .where(MonitorCheck.website_id == website.id)
            .order_by(MonitorCheck.checked_at.desc())
            .limit(PREDICTION_HISTORY_LIMIT)
        )

        checks = list(database.scalars(statement).all())

        checks.reverse()

        predictions.append(
            calculate_maintenance_prediction(
                website,
                checks,
            )
        )

    risk_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
        "unknown": 4,
    }

    return sorted(
        predictions,
        key=lambda prediction: (
            risk_order.get(
                prediction.risk_level,
                5,
            ),
            -prediction.risk_score,
        ),
    )
