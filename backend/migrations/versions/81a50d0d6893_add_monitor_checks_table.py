"""add monitor checks table

Revision ID: 81a50d0d6893
Revises: 22aa1345db99
Create Date: 2026-09-15 15:26:23.169697
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "81a50d0d6893"
down_revision: str | Sequence[str] | None = "22aa1345db99"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the monitor_checks table."""
    op.create_table(
        "monitor_checks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("website_id", sa.Integer(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("is_up", sa.Boolean(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("checked_url", sa.String(length=500), nullable=False),
        sa.Column(
            "checked_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["website_id"],
            ["websites.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_monitor_checks_id"),
        "monitor_checks",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_monitor_checks_website_id"),
        "monitor_checks",
        ["website_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_monitor_checks_checked_at"),
        "monitor_checks",
        ["checked_at"],
        unique=False,
    )


def downgrade() -> None:
    """Remove the monitor_checks table."""
    op.drop_index(
        op.f("ix_monitor_checks_checked_at"),
        table_name="monitor_checks",
    )
    op.drop_index(
        op.f("ix_monitor_checks_website_id"),
        table_name="monitor_checks",
    )
    op.drop_index(
        op.f("ix_monitor_checks_id"),
        table_name="monitor_checks",
    )
    op.drop_table("monitor_checks")