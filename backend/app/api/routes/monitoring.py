from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.models.user import User
from app.schemas.monitor_check import (
    MonitorCheckResponse,
    WebsiteStatusResponse,
)
from app.services.access_control import get_owned_website
from app.services.audit import create_audit_log
from app.services.monitoring_manager import (
    perform_and_store_check,
)

router = APIRouter()


@router.post(
    "/websites/{website_id}/check",
    response_model=MonitorCheckResponse,
    status_code=status.HTTP_201_CREATED,
)
async def run_manual_health_check(
    website_id: int,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitorCheck:
    """Run an immediate health check for an owned website."""

    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    if not website.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Website monitoring is disabled.",
        )

    monitor_check = await perform_and_store_check(
        database=database,
        website=website,
    )

    create_audit_log(
        database,
        user_id=current_user.id,
        action="monitoring.manual_check",
        resource_type="website",
        resource_id=website.id,
        description=(f'A manual health check was run for "{website.name}".'),
        details={
            "website_name": website.name,
            "website_url": website.url,
            "is_up": monitor_check.is_up,
            "status_code": monitor_check.status_code,
            "response_time_ms": monitor_check.response_time_ms,
            "error_message": monitor_check.error_message,
            "is_anomaly": monitor_check.is_anomaly,
            "anomaly_score": monitor_check.anomaly_score,
        },
    )

    database.commit()

    return monitor_check


@router.get(
    "/websites/{website_id}/checks",
    response_model=list[MonitorCheckResponse],
)
def get_health_check_history(
    website_id: int,
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MonitorCheck]:
    """Return health-check history for an owned website."""

    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website.id)
        .order_by(
            MonitorCheck.checked_at.desc(),
            MonitorCheck.id.desc(),
        )
        .limit(limit)
        .offset(offset)
    )

    return list(database.scalars(statement).all())


@router.get(
    "/websites/{website_id}/latest",
    response_model=MonitorCheckResponse | None,
)
def get_latest_health_check(
    website_id: int,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitorCheck | None:
    """Return the latest health check for an owned website."""

    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website.id)
        .order_by(
            MonitorCheck.checked_at.desc(),
            MonitorCheck.id.desc(),
        )
        .limit(1)
    )

    return database.scalar(statement)


@router.get(
    "/websites/{website_id}/status",
    response_model=WebsiteStatusResponse,
)
def get_website_status(
    website_id: int,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WebsiteStatusResponse:
    """Return the current monitoring status of an owned website."""

    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website.id)
        .order_by(
            MonitorCheck.checked_at.desc(),
            MonitorCheck.id.desc(),
        )
        .limit(1)
    )

    latest_check = database.scalar(statement)

    if latest_check is None:
        current_status = "not_checked"
    elif latest_check.is_up:
        current_status = "up"
    else:
        current_status = "down"

    return WebsiteStatusResponse(
        website_id=website.id,
        website_name=website.name,
        website_url=website.url,
        current_status=current_status,
        latest_check=latest_check,
    )
