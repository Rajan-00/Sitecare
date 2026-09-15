from dataclasses import dataclass
from statistics import median

from sklearn.ensemble import IsolationForest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck

MINIMUM_TRAINING_SAMPLES = 20
TRAINING_HISTORY_LIMIT = 200
ROBUST_Z_SCORE_THRESHOLD = 3.5


@dataclass
class AnomalyResult:
    is_anomaly: bool
    anomaly_score: float | None
    anomaly_reason: str | None
    training_sample_count: int


def calculate_statistical_anomaly(
    historical_values: list[float],
    current_value: float,
) -> bool:
    """Detect extreme values using median absolute deviation."""

    historical_median = median(historical_values)

    absolute_deviations = [
        abs(value - historical_median)
        for value in historical_values
    ]

    median_absolute_deviation = median(absolute_deviations)

    if median_absolute_deviation > 0:
        robust_z_score = (
            0.6745
            * abs(current_value - historical_median)
            / median_absolute_deviation
        )

        return robust_z_score >= ROBUST_Z_SCORE_THRESHOLD

    # Handle a completely stable history where every value is identical.
    minimum_tolerance_ms = 50.0
    percentage_tolerance = abs(historical_median) * 0.50

    allowed_difference = max(
        minimum_tolerance_ms,
        percentage_tolerance,
    )

    return abs(current_value - historical_median) > allowed_difference


def detect_anomaly_from_values(
    historical_values: list[float],
    current_value: float,
) -> AnomalyResult:
    if len(historical_values) < MINIMUM_TRAINING_SAMPLES:
        return AnomalyResult(
            is_anomaly=False,
            anomaly_score=None,
            anomaly_reason=None,
            training_sample_count=len(historical_values),
        )

    training_data = [[value] for value in historical_values]

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=1,
    )

    model.fit(training_data)

    prediction = int(
        model.predict([[current_value]])[0]
    )

    decision_score = float(
        model.decision_function([[current_value]])[0]
    )

    machine_learning_anomaly = prediction == -1

    statistical_anomaly = calculate_statistical_anomaly(
        historical_values=historical_values,
        current_value=current_value,
    )

    is_anomaly = (
        machine_learning_anomaly
        or statistical_anomaly
    )

    historical_average = (
        sum(historical_values)
        / len(historical_values)
    )

    if is_anomaly:
        percentage_difference = (
            (current_value - historical_average)
            / historical_average
            * 100
            if historical_average > 0
            else 0
        )

        if current_value > historical_average:
            reason = (
                "Response time is unusually slow: "
                f"{current_value:.2f} ms compared with "
                f"a historical average of "
                f"{historical_average:.2f} ms "
                f"({percentage_difference:.1f}% slower)."
            )
        else:
            reason = (
                "Response time is unusually different: "
                f"{current_value:.2f} ms compared with "
                f"a historical average of "
                f"{historical_average:.2f} ms."
            )
    else:
        reason = None

    return AnomalyResult(
        is_anomaly=is_anomaly,
        anomaly_score=round(decision_score, 6),
        anomaly_reason=reason,
        training_sample_count=len(historical_values),
    )


def detect_check_anomaly(
    database: Session,
    check: MonitorCheck,
) -> AnomalyResult:
    if not check.is_up or check.response_time_ms is None:
        return AnomalyResult(
            is_anomaly=False,
            anomaly_score=None,
            anomaly_reason=None,
            training_sample_count=0,
        )

    statement = (
        select(MonitorCheck.response_time_ms)
        .where(
            MonitorCheck.website_id == check.website_id,
            MonitorCheck.id != check.id,
            MonitorCheck.is_up.is_(True),
            MonitorCheck.response_time_ms.is_not(None),
        )
        .order_by(MonitorCheck.checked_at.desc())
        .limit(TRAINING_HISTORY_LIMIT)
    )

    historical_values = [
        float(value)
        for value in database.scalars(statement).all()
        if value is not None
    ]

    return detect_anomaly_from_values(
        historical_values=historical_values,
        current_value=check.response_time_ms,
    )