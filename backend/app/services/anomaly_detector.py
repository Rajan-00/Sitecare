from dataclasses import dataclass
from statistics import mean, pstdev

from sklearn.ensemble import IsolationForest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck

MINIMUM_TRAINING_SAMPLES = 20
TRAINING_HISTORY_LIMIT = 200
ANOMALY_CONTAMINATION = 0.05
STATISTICAL_THRESHOLD = 3.5


@dataclass
class AnomalyResult:
    is_anomaly: bool
    anomaly_score: float | None
    anomaly_reason: str | None
    training_sample_count: int


def detect_anomaly_from_values(
    historical_values: list[float],
    current_value: float,
) -> AnomalyResult:
    sample_count = len(historical_values)

    if sample_count < MINIMUM_TRAINING_SAMPLES:
        return AnomalyResult(
            is_anomaly=False,
            anomaly_score=None,
            anomaly_reason=None,
            training_sample_count=sample_count,
        )

    training_data = [[float(value)] for value in historical_values]

    model = IsolationForest(
        n_estimators=100,
        contamination=ANOMALY_CONTAMINATION,
        random_state=42,
        n_jobs=1,
    )

    model.fit(training_data)

    prediction = int(model.predict([[float(current_value)]])[0])

    decision_score = float(model.decision_function([[float(current_value)]])[0])

    historical_average = mean(historical_values)
    historical_deviation = pstdev(historical_values)

    difference = abs(float(current_value) - historical_average)

    if historical_deviation > 0:
        deviation_score = difference / historical_deviation

        statistical_anomaly = deviation_score >= STATISTICAL_THRESHOLD
    else:
        minimum_significant_difference = max(
            historical_average * 0.5,
            50.0,
        )

        deviation_score = difference / max(minimum_significant_difference, 1.0)

        statistical_anomaly = difference >= minimum_significant_difference

    isolation_forest_anomaly = prediction == -1

    is_anomaly = isolation_forest_anomaly or statistical_anomaly

    if statistical_anomaly and not isolation_forest_anomaly:
        anomaly_score = -abs(deviation_score)
    else:
        anomaly_score = decision_score

    reason: str | None = None

    if is_anomaly:
        if historical_average > 0:
            percentage_difference = (
                (float(current_value) - historical_average) / historical_average * 100
            )
        else:
            percentage_difference = 0.0

        if float(current_value) > historical_average:
            reason = (
                "Response time is unusually slow: "
                f"{float(current_value):.2f} ms compared "
                "with a historical average of "
                f"{historical_average:.2f} ms "
                f"({percentage_difference:.1f}% slower)."
            )
        else:
            reason = (
                "Response time is unusually different: "
                f"{float(current_value):.2f} ms compared "
                "with a historical average of "
                f"{historical_average:.2f} ms."
            )

    return AnomalyResult(
        is_anomaly=is_anomaly,
        anomaly_score=round(anomaly_score, 6),
        anomaly_reason=reason,
        training_sample_count=sample_count,
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
        .order_by(
            MonitorCheck.checked_at.desc(),
            MonitorCheck.id.desc(),
        )
        .limit(TRAINING_HISTORY_LIMIT)
    )

    historical_values = [
        float(value) for value in database.scalars(statement).all() if value is not None
    ]

    return detect_anomaly_from_values(
        historical_values=historical_values,
        current_value=float(check.response_time_ms),
    )
