from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.db.session import get_db
from app.models.incident import Incident
from app.models.website import Website
from app.schemas.incident import (
    IncidentResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[IncidentResponse],
)
def list_incidents(
    current_user: CurrentUserDependency,
    resolved: bool | None = None,
    website_id: int | None = None,
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    database: Session = Depends(get_db),
) -> list[Incident]:
    statement = (
        select(Incident)
        .join(
            Website,
            Website.id == Incident.website_id,
        )
        .where(Website.user_id == current_user.id)
    )

    if resolved is not None:
        statement = statement.where(Incident.is_resolved.is_(resolved))

    if website_id is not None:
        statement = statement.where(Incident.website_id == website_id)

    statement = statement.order_by(Incident.started_at.desc()).limit(limit)

    return list(database.scalars(statement).all())
