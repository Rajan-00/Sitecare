from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class WebsiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    url: HttpUrl
    check_interval_minutes: int = Field(default=5, ge=1, le=1440)


class WebsiteResponse(BaseModel):
    id: int
    name: str
    url: str
    check_interval_minutes: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
