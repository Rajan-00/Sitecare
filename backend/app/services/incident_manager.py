from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.website import Website


def make_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def determine_severity(
    status_code: int | None,
) -> str:
    if status_code is None:
        return "critical"

    if status_code >= 500:
        return "critical"

    return "warning"


def determine_cause(
    check: MonitorCheck,
) -> str:
    if check.error_message:
        return check.error_message

    if check.status_code is not None:
        return f"Website returned HTTP {check.status_code}."

    return "Website could not be reached."


def get_open_incident(
    database: Session,
    website_id: int,
) -> Incident | None:
    statement = (
        select(Incident)
        .where(
            Incident.website_id == website_id,
            Incident.is_resolved.is_(False),
        )
        .order_by(Incident.started_at.desc())
        .limit(1)
    )

    return database.scalar(statement)


def update_incident_state(
    database: Session,
    website: Website,
    check: MonitorCheck,
) -> Incident | None:
    open_incident = get_open_incident(
        database,
        website.id,
    )

    if not check.is_up:
        severity = determine_severity(check.status_code)
        cause = determine_cause(check)

        if open_incident is not None:
            open_incident.failure_count += 1
            open_incident.latest_status_code = check.status_code
            open_incident.cause = cause

            if severity == "critical":
                open_incident.severity = "critical"

            return open_incident

        incident = Incident(
            website_id=website.id,
            severity=severity,
            cause=cause,
            first_status_code=check.status_code,
            latest_status_code=check.status_code,
            failure_count=1,
            is_resolved=False,
            started_at=check.checked_at,
        )

        database.add(incident)

        return incident

    if open_incident is not None:
        resolved_at = make_utc(check.checked_at)
        started_at = make_utc(open_incident.started_at)

        open_incident.is_resolved = True
        open_incident.resolved_at = resolved_at
        open_incident.duration_seconds = round(
            (resolved_at - started_at).total_seconds(),
            2,
        )

        return open_incident

    return None
