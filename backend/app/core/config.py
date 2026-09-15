from functools import lru_cache

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    app_name: str = "SiteCare AI API"
    app_env: str = "development"
    database_url: str = "sqlite:///./sitecare.db"

    scheduler_enabled: bool = True
    scheduler_interval_seconds: int = 60

    jwt_secret_key: str = "WVReaIYy2ROjz_bBZUdKFM2lDNXIsKtaeIUBALp9LWbbtaYwfcMGp1fz2jdvZqV0sZmulb_ZavKY4uHdv6LY5Q"
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
        extra="ignore",
    )

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_from_email)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Authentication

