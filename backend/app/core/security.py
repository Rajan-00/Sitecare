from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()

DUMMY_PASSWORD_HASH = password_hash.hash("sitecare-dummy-password")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    user_id: int,
) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=(settings.access_token_expire_minutes))

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "iat": datetime.now(UTC),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
