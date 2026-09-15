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

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.db.session import get_db
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.website import (
    WebsiteCreate,
    WebsiteResponse,
    WebsiteUpdate,
)
from app.services.access_control import (
    get_owned_website,
)

router = APIRouter()


def ensure_unique_url(
    database: Session,
    user_id: int,
    url: str,
    excluded_website_id: int | None = None,
) -> None:
    statement = select(Website).where(
        Website.user_id == user_id,
        Website.url == url,
    )

    if excluded_website_id is not None:
        statement = statement.where(Website.id != excluded_website_id)

    if database.scalar(statement) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("A website with this URL already exists."),
        )


@router.post(
    "",
    response_model=WebsiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_website(
    payload: WebsiteCreate,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> Website:
    normalized_url = str(payload.url)

    ensure_unique_url(
        database,
        current_user.id,
        normalized_url,
    )

    website = Website(
        user_id=current_user.id,
        name=payload.name.strip(),
        url=normalized_url,
        check_interval_minutes=(payload.check_interval_minutes),
    )

    database.add(website)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create website.",
        ) from None

    database.refresh(website)

    return website


@router.get(
    "",
    response_model=list[WebsiteResponse],
)
def list_websites(
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> list[Website]:
    statement = (
        select(Website)
        .where(Website.user_id == current_user.id)
        .order_by(Website.created_at.desc())
    )

    return list(database.scalars(statement).all())


@router.get(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def get_website(
    website_id: int,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> Website:
    return get_owned_website(
        database,
        current_user,
        website_id,
    )


@router.patch(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def update_website(
    website_id: int,
    payload: WebsiteUpdate,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> Website:
    website = get_owned_website(
        database,
        current_user,
        website_id,
    )

    update_data = payload.model_dump(exclude_unset=True)

    if payload.url is not None:
        normalized_url = str(payload.url)

        ensure_unique_url(
            database,
            current_user.id,
            normalized_url,
            excluded_website_id=website.id,
        )

        update_data["url"] = normalized_url

    for field, value in update_data.items():
        setattr(website, field, value)

    database.commit()
    database.refresh(website)

    return website


@router.delete(
    "/{website_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_website(
    website_id: int,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> Response:
    website = get_owned_website(
        database,
        current_user,
        website_id,
    )

    database.execute(delete(Incident).where(Incident.website_id == website.id))

    database.execute(delete(MonitorCheck).where(MonitorCheck.website_id == website.id))

    database.delete(website)
    database.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
