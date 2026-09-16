from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import (
    AuditLogListResponse,
    AuditLogResponse,
)

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    action: str | None = Query(default=None),
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditLogListResponse:
    conditions = [AuditLog.user_id == current_user.id]

    if action:
        conditions.append(AuditLog.action == action)

    total = database.scalar(select(func.count(AuditLog.id)).where(*conditions))

    audit_logs = database.scalars(
        select(AuditLog)
        .where(*conditions)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in audit_logs],
        total=total or 0,
        limit=limit,
        offset=offset,
    )
