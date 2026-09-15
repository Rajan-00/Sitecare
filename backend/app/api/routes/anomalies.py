from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.schemas.monitor_check import (
    MonitorCheckResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[MonitorCheckResponse],
)
def list_anomalies(
    website_id: int | None = None,
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    database: Session = Depends(get_db),
) -> list[MonitorCheck]:
    statement = select(MonitorCheck).where(MonitorCheck.is_anomaly.is_(True))

    if website_id is not None:
        statement = statement.where(MonitorCheck.website_id == website_id)

    statement = statement.order_by(MonitorCheck.checked_at.desc()).limit(limit)

    return list(database.scalars(statement).all())
