from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    WebsiteMetricResponse,
)
from app.services.dashboard_analytics import (
    build_dashboard_summary,
    build_website_metrics,
)

router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    database: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    return build_dashboard_summary(database)


@router.get(
    "/websites",
    response_model=list[WebsiteMetricResponse],
)
def get_dashboard_websites(
    database: Session = Depends(get_db),
) -> list[WebsiteMetricResponse]:
    return build_website_metrics(database)
