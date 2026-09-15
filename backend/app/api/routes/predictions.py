from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.maintenance import (
    MaintenancePredictionResponse,
)
from app.services.maintenance_predictor import (
    build_maintenance_predictions,
    calculate_maintenance_prediction,
)

router = APIRouter()


@router.get(
    "/maintenance",
    response_model=list[MaintenancePredictionResponse],
)
def list_maintenance_predictions(
    database: Session = Depends(get_db),
) -> list[MaintenancePredictionResponse]:
    return build_maintenance_predictions(database)


@router.get(
    "/maintenance/{website_id}",
    response_model=MaintenancePredictionResponse,
)
def get_maintenance_prediction(
    website_id: int,
    database: Session = Depends(get_db),
) -> MaintenancePredictionResponse:
    website = database.get(
        Website,
        website_id,
    )

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website_id)
        .order_by(MonitorCheck.checked_at.desc())
        .limit(100)
    )

    checks = list(database.scalars(statement).all())

    checks.reverse()

    return calculate_maintenance_prediction(
        website,
        checks,
    )
