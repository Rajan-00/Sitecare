from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.core.config import settings
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    UserRegister,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: UserRegister,
    database: Session = Depends(get_db),
) -> User:
    normalized_email = str(payload.email).strip().lower()

    existing_user = database.scalar(select(User).where(User.email == normalized_email))

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("An account with this email already exists."),
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=hash_password(payload.password),
    )

    database.add(user)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("An account with this email already exists."),
        ) from None

    database.refresh(user)

    return user


@router.post(
    "/login",
    response_model=AccessTokenResponse,
)
def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends(),
    ],
    database: Session = Depends(get_db),
) -> AccessTokenResponse:
    normalized_email = form_data.username.strip().lower()

    user = database.scalar(select(User).where(User.email == normalized_email))

    if user is None:
        verify_password(
            form_data.password,
            DUMMY_PASSWORD_HASH,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    access_token = create_access_token(user.id)

    return AccessTokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=(settings.access_token_expire_minutes * 60),
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_authenticated_user(
    current_user: CurrentUserDependency,
) -> User:
    return current_user
