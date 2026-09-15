from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.account import (
    MessageResponse,
    PasswordChange,
    ProfileUpdate,
)
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/account", tags=["Account"])


@router.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    normalized_email = str(payload.email).strip().lower()
    normalized_name = payload.full_name.strip()

    if len(normalized_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must contain at least 2 characters.",
        )

    existing_user = database.scalar(
        select(User).where(
            User.email == normalized_email,
            User.id != current_user.id,
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    current_user.full_name = normalized_name
    current_user.email = normalized_email

    try:
        database.commit()
        database.refresh(current_user)
    except IntegrityError:
        database.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: PasswordChange,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    if not verify_password(
        payload.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    database.commit()

    return MessageResponse(message="Password changed successfully.")
