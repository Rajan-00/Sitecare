from datetime import UTC, datetime, timedelta
from getpass import getpass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.models.in_app_notification import (
    InAppNotification,
)
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.notification_preference import (
    NotificationPreference,
)
from app.models.user import User
from app.models.website import Website

DEMO_EMAIL = "demo@sitecareai.com"
DEMO_NAME = "SiteCare Demo User"
CHECK_COUNT = 40


def get_demo_password() -> str:
    print("\nCreate a password for the demo account.")

    password = getpass("Demo password: ")
    confirmation = getpass("Confirm password: ")

    if password != confirmation:
        raise ValueError(
            "The passwords do not match.",
        )

    if len(password) < 8:
        raise ValueError(
            "The password must contain at least "
            "8 characters.",
        )

    return password


def remove_existing_demo_data(
    database: Session,
    user: User,
) -> None:
    website_ids = list(
        database.scalars(
            select(Website.id).where(
                Website.user_id == user.id,
            )
        ).all()
    )

    if website_ids:
        database.execute(
            delete(Incident).where(
                Incident.website_id.in_(
                    website_ids,
                )
            )
        )

        database.execute(
            delete(MonitorCheck).where(
                MonitorCheck.website_id.in_(
                    website_ids,
                )
            )
        )

    database.execute(
        delete(InAppNotification).where(
            InAppNotification.user_id == user.id,
        )
    )

    database.execute(
        delete(NotificationPreference).where(
            NotificationPreference.user_id == user.id,
        )
    )

    database.execute(
        delete(AuditLog).where(
            AuditLog.user_id == user.id,
        )
    )

    database.execute(
        delete(Website).where(
            Website.user_id == user.id,
        )
    )

    database.flush()


def create_or_update_demo_user(
    database: Session,
    password: str,
) -> User:
    user = database.scalar(
        select(User).where(
            User.email == DEMO_EMAIL,
        )
    )

    if user is None:
        user = User(
            full_name=DEMO_NAME,
            email=DEMO_EMAIL,
            hashed_password=hash_password(password),
            is_active=True,
        )

        database.add(user)
        database.flush()

        return user

    user.full_name = DEMO_NAME
    user.hashed_password = hash_password(password)
    user.is_active = True

    remove_existing_demo_data(
        database,
        user,
    )

    database.flush()

    return user


def create_websites(
    database: Session,
    user: User,
    now: datetime,
) -> dict[str, Website]:
    websites = {
        "healthy": Website(
            user_id=user.id,
            name="Nepfinity Technologies",
            url="https://nepfinitytechnologies.com/",
            check_interval_minutes=5,
            is_active=True,
            created_at=now - timedelta(days=30),
        ),
        "degraded": Website(
            user_id=user.id,
            name="College Student Portal",
            url="https://portal.example.edu/",
            check_interval_minutes=10,
            is_active=True,
            created_at=now - timedelta(days=20),
        ),
        "down": Website(
            user_id=user.id,
            name="SiteCare Demo API",
            url="https://api.example.com/",
            check_interval_minutes=5,
            is_active=True,
            created_at=now - timedelta(days=12),
        ),
    }

    database.add_all(websites.values())
    database.flush()

    return websites


def add_check(
    database: Session,
    website: Website,
    *,
    checked_at: datetime,
    response_time_ms: float | None,
    is_up: bool,
    status_code: int | None,
    is_anomaly: bool = False,
    anomaly_reason: str | None = None,
    error_message: str | None = None,
) -> None:
    database.add(
        MonitorCheck(
            website_id=website.id,
            status_code=status_code,
            response_time_ms=response_time_ms,
            is_up=is_up,
            error_message=error_message,
            checked_url=website.url,
            is_anomaly=is_anomaly,
            anomaly_score=(
                -0.18 if is_anomaly else None
            ),
            anomaly_reason=anomaly_reason,
            checked_at=checked_at,
        )
    )


def create_monitoring_history(
    database: Session,
    websites: dict[str, Website],
    now: datetime,
) -> None:
    start_time = now - timedelta(
        minutes=(CHECK_COUNT - 1) * 15,
    )

    api_failures = {
        6,
        7,
        18,
        19,
        20,
        21,
        30,
        31,
        35,
        36,
        38,
        39,
    }

    for index in range(CHECK_COUNT):
        checked_at = start_time + timedelta(
            minutes=index * 15,
        )

        healthy_response = float(
            145 + (index % 7) * 6,
        )

        healthy_anomaly = index == 30

        if healthy_anomaly:
            healthy_response = 1080.0

        add_check(
            database,
            websites["healthy"],
            checked_at=checked_at,
            response_time_ms=healthy_response,
            is_up=True,
            status_code=200,
            is_anomaly=healthy_anomaly,
            anomaly_reason=(
                "Response time increased to 1080 ms "
                "from a historical average below 200 ms."
                if healthy_anomaly
                else None
            ),
        )

        portal_failure = index in {
            12,
            13,
            14,
        }

        portal_anomaly = index in {
            29,
            34,
        }

        portal_response = float(
            280 + index * 18,
        )

        if portal_anomaly:
            portal_response += 900

        add_check(
            database,
            websites["degraded"],
            checked_at=checked_at,
            response_time_ms=(
                1250.0
                if portal_failure
                else portal_response
            ),
            is_up=not portal_failure,
            status_code=(
                503 if portal_failure else 200
            ),
            is_anomaly=portal_anomaly,
            anomaly_reason=(
                "Response time is significantly above "
                "the normal portal response time."
                if portal_anomaly
                else None
            ),
            error_message=(
                "Service temporarily unavailable."
                if portal_failure
                else None
            ),
        )

        api_failure = index in api_failures

        api_anomaly = (
            index in {24, 28, 33}
            and not api_failure
        )

        api_response = float(
            360 + index * 25,
        )

        if api_anomaly:
            api_response += 1100

        add_check(
            database,
            websites["down"],
            checked_at=checked_at,
            response_time_ms=(
                1600.0
                if api_failure
                else api_response
            ),
            is_up=not api_failure,
            status_code=(
                500 if api_failure else 200
            ),
            is_anomaly=api_anomaly,
            anomaly_reason=(
                "API latency exceeded the expected "
                "performance range."
                if api_anomaly
                else None
            ),
            error_message=(
                "Internal server error."
                if api_failure
                else None
            ),
        )


def create_incidents(
    database: Session,
    websites: dict[str, Website],
    now: datetime,
) -> None:
    portal_started = now - timedelta(
        hours=6,
        minutes=45,
    )
    portal_resolved = portal_started + timedelta(
        minutes=45,
    )

    api_old_started = now - timedelta(
        hours=5,
        minutes=15,
    )
    api_old_resolved = api_old_started + timedelta(
        hours=1,
    )

    api_open_started = now - timedelta(
        hours=1,
    )

    database.add_all(
        [
            Incident(
                website_id=websites["degraded"].id,
                severity="critical",
                cause="HTTP 503 service unavailable",
                first_status_code=503,
                latest_status_code=200,
                failure_count=3,
                is_resolved=True,
                started_at=portal_started,
                resolved_at=portal_resolved,
                duration_seconds=2700.0,
            ),
            Incident(
                website_id=websites["down"].id,
                severity="critical",
                cause="Repeated HTTP 500 responses",
                first_status_code=500,
                latest_status_code=200,
                failure_count=4,
                is_resolved=True,
                started_at=api_old_started,
                resolved_at=api_old_resolved,
                duration_seconds=3600.0,
            ),
            Incident(
                website_id=websites["down"].id,
                severity="critical",
                cause="Internal server error",
                first_status_code=500,
                latest_status_code=500,
                failure_count=4,
                is_resolved=False,
                started_at=api_open_started,
                resolved_at=None,
                duration_seconds=None,
            ),
        ]
    )


def create_notifications(
    database: Session,
    user: User,
    websites: dict[str, Website],
    now: datetime,
) -> None:
    database.add(
        NotificationPreference(
            user_id=user.id,
            email_address=user.email,
            is_enabled=True,
            notify_on_downtime=True,
            notify_on_recovery=True,
            notify_on_anomaly=True,
            created_at=now - timedelta(days=20),
            updated_at=now,
        )
    )

    database.add_all(
        [
            InAppNotification(
                user_id=user.id,
                title="Website is currently down",
                message=(
                    "SiteCare Demo API is returning "
                    "HTTP 500 responses."
                ),
                notification_type="downtime",
                resource_type="website",
                resource_id=websites["down"].id,
                is_read=False,
                created_at=now - timedelta(minutes=15),
            ),
            InAppNotification(
                user_id=user.id,
                title="Website recovered",
                message=(
                    "College Student Portal recovered "
                    "after 45 minutes."
                ),
                notification_type="recovery",
                resource_type="website",
                resource_id=websites["degraded"].id,
                is_read=True,
                created_at=now - timedelta(hours=6),
                read_at=now - timedelta(hours=5),
            ),
            InAppNotification(
                user_id=user.id,
                title="Response-time anomaly detected",
                message=(
                    "Nepfinity Technologies recorded "
                    "an unusually slow response."
                ),
                notification_type="anomaly",
                resource_type="website",
                resource_id=websites["healthy"].id,
                is_read=False,
                created_at=now - timedelta(hours=2),
            ),
        ]
    )


def create_audit_logs(
    database: Session,
    user: User,
    websites: dict[str, Website],
    now: datetime,
) -> None:
    logs: list[AuditLog] = []

    for offset, website in enumerate(
        websites.values(),
    ):
        logs.append(
            AuditLog(
                user_id=user.id,
                action="website.created",
                resource_type="website",
                resource_id=website.id,
                description=(
                    f"Added {website.name} to monitoring."
                ),
                created_at=now
                - timedelta(days=10 - offset),
            )
        )

    logs.append(
        AuditLog(
            user_id=user.id,
            action="monitoring.manual_check",
            resource_type="website",
            resource_id=websites["down"].id,
            description=(
                "Ran a manual health check for "
                "SiteCare Demo API."
            ),
            created_at=now - timedelta(minutes=15),
        )
    )

    database.add_all(logs)


def seed_demo_data() -> None:
    password = get_demo_password()
    now = datetime.now(UTC)

    with SessionLocal() as database:
        try:
            user = create_or_update_demo_user(
                database,
                password,
            )

            websites = create_websites(
                database,
                user,
                now,
            )

            create_monitoring_history(
                database,
                websites,
                now,
            )

            create_incidents(
                database,
                websites,
                now,
            )

            create_notifications(
                database,
                user,
                websites,
                now,
            )

            create_audit_logs(
                database,
                user,
                websites,
                now,
            )

            database.commit()
        except Exception:
            database.rollback()
            raise

    print("\nDemo data created successfully.")
    print(f"Email: {DEMO_EMAIL}")
    print("Use the password you entered.")
    print("Websites: 3")
    print("Monitoring checks: 120")
    print("Open the dashboard to view the demo.")


if __name__ == "__main__":
    seed_demo_data()