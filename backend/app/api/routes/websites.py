from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.website import (
    WebsiteCreate,
    WebsiteResponse,
    WebsiteUpdate,
)

router = APIRouter()


def get_website_or_404(
    website_id: int,
    database: Session,
) -> Website:
    website = database.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    return website


@router.post(
    "",
    response_model=WebsiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_website(
    payload: WebsiteCreate,
    database: Session = Depends(get_db),
) -> Website:
    website = Website(
        name=payload.name,
        url=str(payload.url),
        check_interval_minutes=(payload.check_interval_minutes),
    )

    database.add(website)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A website with this URL already exists.",
        ) from None

    database.refresh(website)

    return website


@router.get(
    "",
    response_model=list[WebsiteResponse],
)
def list_websites(
    database: Session = Depends(get_db),
) -> list[Website]:
    statement = select(Website).order_by(Website.created_at.desc())

    return list(database.scalars(statement).all())


@router.get(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def get_website(
    website_id: int,
    database: Session = Depends(get_db),
) -> Website:
    return get_website_or_404(
        website_id,
        database,
    )


@router.patch(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def update_website(
    website_id: int,
    payload: WebsiteUpdate,
    database: Session = Depends(get_db),
) -> Website:
    website = get_website_or_404(
        website_id,
        database,
    )

    update_data = payload.model_dump(exclude_unset=True)

    if payload.url is not None:
        update_data["url"] = str(payload.url)

    for field, value in update_data.items():
        setattr(website, field, value)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A website with this URL already exists.",
        ) from None

    database.refresh(website)

    return website


@router.delete(
    "/{website_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_website(
    website_id: int,
    database: Session = Depends(get_db),
) -> Response:
    website = get_website_or_404(
        website_id,
        database,
    )
    database.execute(delete(Incident).where(Incident.website_id == website.id))

    database.execute(delete(MonitorCheck).where(MonitorCheck.website_id == website.id))

    database.delete(website)
    database.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
