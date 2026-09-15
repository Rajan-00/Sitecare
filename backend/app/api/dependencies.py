from typing import Annotated

import jwt
from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DatabaseDependency = Annotated[
    Session,
    Depends(get_db),
]

TokenDependency = Annotated[
    str,
    Depends(oauth2_scheme),
]


def get_current_user(
    token: TokenDependency,
    database: DatabaseDependency,
) -> User:
    authentication_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        subject = payload.get("sub")

        if subject is None:
            raise authentication_error

        user_id = int(subject)
    except (
        InvalidTokenError,
        ValueError,
    ):
        raise authentication_error from None

    user = database.get(User, user_id)

    if user is None or not user.is_active:
        raise authentication_error

    return user


CurrentUserDependency = Annotated[
    User,
    Depends(get_current_user),
]
