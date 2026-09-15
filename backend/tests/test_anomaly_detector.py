from app.services.anomaly_detector import (
    MINIMUM_TRAINING_SAMPLES,
    detect_anomaly_from_values,
)


def test_insufficient_history_does_not_predict() -> None:
    historical_values = [100.0 for _ in range(MINIMUM_TRAINING_SAMPLES - 1)]

    result = detect_anomaly_from_values(
        historical_values,
        current_value=2000.0,
    )

    assert result.is_anomaly is False
    assert result.anomaly_score is None
    assert result.anomaly_reason is None


def test_normal_response_time_is_not_anomaly() -> None:
    historical_values = [
        95.0,
        97.0,
        99.0,
        101.0,
        103.0,
        105.0,
        98.0,
        102.0,
        100.0,
        96.0,
    ] * 3

    result = detect_anomaly_from_values(
        historical_values,
        current_value=101.0,
    )

    assert result.is_anomaly is False
    assert result.anomaly_score is not None
    assert result.anomaly_reason is None


def test_extreme_response_time_is_anomaly() -> None:
    historical_values = [
        95.0,
        97.0,
        99.0,
        101.0,
        103.0,
        105.0,
        98.0,
        102.0,
        100.0,
        96.0,
    ] * 3

    result = detect_anomaly_from_values(
        historical_values,
        current_value=3000.0,
    )

    assert result.is_anomaly is True
    assert result.anomaly_score is not None
    assert result.anomaly_reason is not None
    assert "unusually slow" in result.anomaly_reason
