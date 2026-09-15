from datetime import UTC, datetime, timedelta

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.maintenance_predictor import (
    calculate_maintenance_prediction,
)


def create_website() -> Website:
    return Website(
        id=1,
        name="Prediction Test",
        url="https://example.com/",
        check_interval_minutes=5,
        is_active=True,
        user_id=999,
    )


def create_checks(
    response_times: list[float],
) -> list[MonitorCheck]:
    starting_time = datetime.now(UTC)

    return [
        MonitorCheck(
            id=index + 1,
            website_id=1,
            status_code=200,
            response_time_ms=response_time,
            is_up=True,
            error_message=None,
            checked_url="https://example.com/",
            is_anomaly=False,
            anomaly_score=0.1,
            anomaly_reason=None,
            checked_at=(starting_time + timedelta(minutes=index)),
        )
        for index, response_time in enumerate(response_times)
    ]


def test_insufficient_data_returns_learning() -> None:
    website = create_website()
    checks = create_checks([100.0, 105.0, 110.0])

    prediction = calculate_maintenance_prediction(
        website,
        checks,
    )

    assert prediction.prediction_status == "learning"
    assert prediction.risk_level == "unknown"
    assert prediction.predicted_response_time_ms is None


def test_stable_performance_has_low_risk() -> None:
    website = create_website()

    checks = create_checks(
        [
            100.0,
            102.0,
            99.0,
            101.0,
            100.0,
            103.0,
            98.0,
            101.0,
            100.0,
            102.0,
            99.0,
            101.0,
        ]
    )

    prediction = calculate_maintenance_prediction(
        website,
        checks,
    )

    assert prediction.prediction_status == "ready"
    assert prediction.risk_level == "low"
    assert prediction.risk_score < 30
    assert prediction.predicted_response_time_ms is not None


def test_degrading_performance_increases_risk() -> None:
    website = create_website()

    checks = create_checks(
        [
            200.0,
            240.0,
            280.0,
            320.0,
            360.0,
            400.0,
            440.0,
            480.0,
            520.0,
            560.0,
        ]
    )

    prediction = calculate_maintenance_prediction(
        website,
        checks,
    )

    assert prediction.prediction_status == "ready"
    assert prediction.risk_score >= 30
    assert prediction.risk_level in {
        "medium",
        "high",
        "critical",
    }
    assert prediction.predicted_response_time_ms > prediction.current_average_response_time_ms
    assert prediction.response_time_trend_ms > 0
