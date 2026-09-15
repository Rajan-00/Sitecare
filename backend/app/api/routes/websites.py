from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.website import Website
from app.schemas.website import WebsiteCreate, WebsiteResponse

router = APIRouter()


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
        check_interval_minutes=payload.check_interval_minutes,
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


@router.get("", response_model=list[WebsiteResponse])
def list_websites(
    database: Session = Depends(get_db),
) -> list[Website]:
    statement = select(Website).order_by(Website.created_at.desc())
    return list(database.scalars(statement).all())


@router.get("/{website_id}", response_model=WebsiteResponse)
def get_website(
    website_id: int,
    database: Session = Depends(get_db),
) -> Website:
    website = database.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    return website
