from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.audit import create_audit_log
from app.services.check_outcome import check_outcome
from app.services.monitoring_notifications import (
    notify_incident_started,
    notify_website_recovered,
)


@dataclass
class IncidentUpdateResult:
    incident: Incident | None
    event: str | None


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
        .order_by(
            Incident.started_at.desc(),
            Incident.id.desc(),
        )
        .limit(1)
    )

    return database.scalar(statement)


def get_check_time(
    monitor_check: MonitorCheck,
) -> datetime:
    checked_at = monitor_check.checked_at

    if checked_at is not None:
        return checked_at

    return datetime.now(UTC)


def make_timezone_aware(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value


def build_incident_reason(
    monitor_check: MonitorCheck,
) -> str:
    if monitor_check.error_message:
        return monitor_check.error_message

    if monitor_check.status_code is not None:
        return f"Website returned HTTP status {monitor_check.status_code}."

    return "Website did not respond successfully."


def determine_severity(
    monitor_check: MonitorCheck,
) -> str:
    status_code = monitor_check.status_code

    if status_code is None:
        return "critical"

    if status_code >= 500:
        return "critical"

    if status_code >= 400:
        return "warning"

    return "warning"


def create_incident(
    database: Session,
    website: Website,
    monitor_check: MonitorCheck,
) -> Incident:
    incident = Incident(
        website_id=website.id,
        severity=determine_severity(monitor_check),
        cause=build_incident_reason(monitor_check),
        first_status_code=monitor_check.status_code,
        latest_status_code=monitor_check.status_code,
        failure_count=1,
        is_resolved=False,
        started_at=get_check_time(monitor_check),
        resolved_at=None,
        duration_seconds=None,
    )

    database.add(incident)
    database.flush()

    notify_incident_started(
        database,
        website=website,
        incident_id=incident.id,
        status_code=monitor_check.status_code,
        error_message=monitor_check.error_message,
    )

    if website.user_id is not None:
        create_audit_log(
            database,
            user_id=website.user_id,
            action="incident.started",
            resource_type="incident",
            resource_id=incident.id,
            description=(f'An incident started for "{website.name}".'),
            details={
                "website_id": website.id,
                "website_name": website.name,
                "website_url": website.url,
                "severity": incident.severity,
                "cause": incident.cause,
                "status_code": monitor_check.status_code,
                "response_time_ms": (monitor_check.response_time_ms),
            },
        )

    return incident


def update_existing_incident(
    incident: Incident,
    monitor_check: MonitorCheck,
) -> Incident:
    incident.failure_count += 1
    incident.latest_status_code = monitor_check.status_code
    incident.severity = determine_severity(monitor_check)

    latest_reason = build_incident_reason(monitor_check)

    if latest_reason:
        incident.cause = latest_reason

    return incident


def resolve_incident(
    database: Session,
    website: Website,
    monitor_check: MonitorCheck,
    incident: Incident,
) -> Incident:
    resolved_at = make_timezone_aware(get_check_time(monitor_check))

    started_at = make_timezone_aware(incident.started_at)

    duration_seconds = max(
        0.0,
        (resolved_at - started_at).total_seconds(),
    )

    incident.is_resolved = True
    incident.resolved_at = resolved_at
    incident.duration_seconds = duration_seconds
    incident.latest_status_code = monitor_check.status_code

    database.flush()

    notify_website_recovered(
        database,
        website=website,
        incident_id=incident.id,
        response_time_ms=(monitor_check.response_time_ms),
    )

    if website.user_id is not None:
        create_audit_log(
            database,
            user_id=website.user_id,
            action="incident.resolved",
            resource_type="incident",
            resource_id=incident.id,
            description=(f'Website "{website.name}" recovered.'),
            details={
                "website_id": website.id,
                "website_name": website.name,
                "website_url": website.url,
                "started_at": (incident.started_at.isoformat()),
                "resolved_at": (resolved_at.isoformat()),
                "duration_seconds": duration_seconds,
                "status_code": monitor_check.status_code,
                "response_time_ms": (monitor_check.response_time_ms),
            },
        )

    return incident


def update_incident_state(
    database: Session,
    website: Website,
    monitor_check: MonitorCheck,
) -> IncidentUpdateResult:
    open_incident = get_open_incident(
        database=database,
        website_id=website.id,
    )

    outcome = check_outcome(monitor_check)

    # An inconclusive probe cannot open, extend, or resolve an outage.
    if outcome in ("blocked", "unknown"):
        return IncidentUpdateResult(incident=open_incident, event=None)

    if outcome == "down":
        if open_incident is not None:
            updated_incident = update_existing_incident(
                incident=open_incident,
                monitor_check=monitor_check,
            )

            return IncidentUpdateResult(
                incident=updated_incident,
                event=None,
            )

        incident = create_incident(
            database=database,
            website=website,
            monitor_check=monitor_check,
        )

        return IncidentUpdateResult(
            incident=incident,
            event="opened",
        )

    if open_incident is not None:
        incident = resolve_incident(
            database=database,
            website=website,
            monitor_check=monitor_check,
            incident=open_incident,
        )

        return IncidentUpdateResult(
            incident=incident,
            event="resolved",
        )

    return IncidentUpdateResult(
        incident=None,
        event=None,
    )


def manage_incident(
    database: Session,
    website: Website,
    monitor_check: MonitorCheck,
) -> IncidentUpdateResult:
    return update_incident_state(
        database=database,
        website=website,
        monitor_check=monitor_check,
    )


def process_incident(
    database: Session,
    website: Website,
    monitor_check: MonitorCheck,
) -> IncidentUpdateResult:
    return update_incident_state(
        database=database,
        website=website,
        monitor_check=monitor_check,
    )
