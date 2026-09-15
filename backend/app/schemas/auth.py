from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


class UserRegister(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse
