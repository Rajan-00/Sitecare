from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.schemas.maintenance import (
    MaintenancePredictionResponse,
)
from app.services.access_control import (
    get_owned_website,
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
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> list[MaintenancePredictionResponse]:
    return build_maintenance_predictions(
        database,
        current_user.id,
    )


@router.get(
    "/maintenance/{website_id}",
    response_model=(MaintenancePredictionResponse),
)
def get_maintenance_prediction(
    website_id: int,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> MaintenancePredictionResponse:
    website = get_owned_website(
        database,
        current_user,
        website_id,
    )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website.id)
        .order_by(MonitorCheck.checked_at.desc())
        .limit(100)
    )

    checks = list(database.scalars(statement).all())

    checks.reverse()

    return calculate_maintenance_prediction(
        website,
        checks,
    )
