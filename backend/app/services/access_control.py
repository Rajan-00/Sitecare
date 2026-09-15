from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.website import Website


def get_owned_website(
    database: Session,
    current_user: User,
    website_id: int,
) -> Website:
    statement = select(Website).where(
        Website.id == website_id,
        Website.user_id == current_user.id,
    )

    website = database.scalar(statement)

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    return website
