from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.monitor_check import (
    MonitorCheckResponse,
    WebsiteStatusResponse,
)
from app.services.website_monitor import check_website

router = APIRouter()


@router.post(
    "/websites/{website_id}/check",
    response_model=MonitorCheckResponse,
    status_code=status.HTTP_201_CREATED,
)
async def run_website_check(
    website_id: int,
    database: Session = Depends(get_db),
) -> MonitorCheck:
    website = database.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    if not website.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Website monitoring is disabled.",
        )

    result = await check_website(website.url)

    monitor_check = MonitorCheck(
        website_id=website.id,
        status_code=result.status_code,
        response_time_ms=result.response_time_ms,
        is_up=result.is_up,
        error_message=result.error_message,
        checked_url=result.checked_url,
    )

    database.add(monitor_check)
    database.commit()
    database.refresh(monitor_check)

    return monitor_check


@router.get(
    "/websites/{website_id}/checks",
    response_model=list[MonitorCheckResponse],
)
def get_check_history(
    website_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    database: Session = Depends(get_db),
) -> list[MonitorCheck]:
    website = database.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website_id)
        .order_by(MonitorCheck.checked_at.desc())
        .limit(limit)
    )

    return list(database.scalars(statement).all())


@router.get(
    "/websites/{website_id}/status",
    response_model=WebsiteStatusResponse,
)
def get_website_status(
    website_id: int,
    database: Session = Depends(get_db),
) -> WebsiteStatusResponse:
    website = database.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website_id)
        .order_by(MonitorCheck.checked_at.desc())
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
