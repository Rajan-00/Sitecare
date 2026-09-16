import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    database: Session,
    *,
    user_id: int,
    action: str,
    description: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        details_json=(json.dumps(details, default=str) if details is not None else None),
    )

    database.add(audit_log)

    return audit_log
