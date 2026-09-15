from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    model_validator,
)


class WebsiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    url: HttpUrl
    check_interval_minutes: int = Field(
        default=5,
        ge=1,
        le=1440,
    )


class WebsiteUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    url: HttpUrl | None = None
    check_interval_minutes: int | None = Field(
        default=None,
        ge=1,
        le=1440,
    )
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_update(self) -> "WebsiteUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")

        return self


class WebsiteResponse(BaseModel):
    id: int
    name: str
    url: str
    check_interval_minutes: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
