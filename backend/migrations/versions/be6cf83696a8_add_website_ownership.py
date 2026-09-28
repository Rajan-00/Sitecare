"""add website ownership

Revision ID: be6cf83696a8
Revises: 000cd1a0793f
Create Date: 2026-09-16 03:05:31.369889
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "be6cf83696a8"
down_revision: str | Sequence[str] | None = (
    "000cd1a0793f"
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add the website user ownership column."""

    with op.batch_alter_table(
        "websites",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "user_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.drop_index(
            batch_op.f("ix_websites_url")
        )

        batch_op.create_index(
            batch_op.f("ix_websites_url"),
            ["url"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f("ix_websites_user_id"),
            ["user_id"],
            unique=False,
        )


def downgrade() -> None:
    """Remove the website user ownership column."""

    with op.batch_alter_table(
        "websites",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f("ix_websites_user_id")
        )

        batch_op.drop_index(
            batch_op.f("ix_websites_url")
        )

        batch_op.create_index(
            batch_op.f("ix_websites_url"),
            ["url"],
            unique=True,
        )

        batch_op.drop_column("user_id")