from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


def default_cors_origins() -> list[str]:
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]


class Settings(BaseSettings):
    app_name: str = "SiteCare AI API"
    app_version: str = "1.0.1"
    app_env: str = "development"

    database_url: str = "sqlite:///./sitecare.db"

    cors_origins: list[str] = Field(
        default_factory=default_cors_origins,
    )

    scheduler_enabled: bool = True
    scheduler_interval_seconds: int = 60

    jwt_secret_key: str = Field(
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator(
        "database_url",
        mode="before",
    )
    @classmethod
    def normalize_database_url(
        cls,
        value: str,
    ) -> str:
        """
        Railway may provide a PostgreSQL URL without
        the explicit psycopg SQLAlchemy driver name.
        """

        if value.startswith("postgres://"):
            return value.replace(
                "postgres://",
                "postgresql+psycopg://",
                1,
            )

        if value.startswith("postgresql://"):
            return value.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return value

    @property
    def smtp_configured(self) -> bool:
        return bool(
            self.smtp_host
            and self.smtp_from_email
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()