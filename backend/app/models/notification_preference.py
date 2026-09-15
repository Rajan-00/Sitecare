from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
    )
    email_address: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    notify_on_downtime: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    notify_on_recovery: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    notify_on_anomaly: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
