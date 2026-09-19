from datetime import UTC, datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.monitoring_scheduler import (
    get_monitoring_scheduler_status,
)

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime


class ReadinessResponse(BaseModel):
    status: str
    service: str
    database: str
    scheduler: str
    scheduler_interval_seconds: int
    timestamp: datetime


@router.get(
    "/health",
    response_model=HealthResponse,
)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="sitecare-ai-api",
        timestamp=datetime.now(UTC),
    )


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
)
def readiness_check(
    database: Session = Depends(get_db),
) -> ReadinessResponse:
    timestamp = datetime.now(UTC)

    try:
        database.execute(
            text("SELECT 1"),
        )
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "status": "not_ready",
                "service": "sitecare-ai-api",
                "database": "unavailable",
                "scheduler": (
                    get_monitoring_scheduler_status()
                ),
                "timestamp": timestamp.isoformat(),
            },
        ) from error

    scheduler_status = (
        get_monitoring_scheduler_status()
    )

    if scheduler_status == "stopped":
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail={
                "status": "not_ready",
                "service": "sitecare-ai-api",
                "database": "connected",
                "scheduler": "stopped",
                "timestamp": timestamp.isoformat(),
            },
        )

    return ReadinessResponse(
        status="ready",
        service="sitecare-ai-api",
        database="connected",
        scheduler=scheduler_status,
        scheduler_interval_seconds=(
            settings.scheduler_interval_seconds
        ),
        timestamp=timestamp,
    )