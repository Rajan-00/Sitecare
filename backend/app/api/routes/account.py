from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.incident import Incident
from app.models.monitor_check import MonitorCheck
from app.models.user import User
from app.models.website import Website
from app.schemas.account import (
    AccountStatisticsResponse,
    MessageResponse,
    PasswordChange,
    ProfileUpdate,
)
from app.schemas.auth import UserResponse
from app.services.audit import create_audit_log

router = APIRouter(prefix="/account", tags=["Account"])


@router.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    normalized_email = str(payload.email).strip().lower()
    normalized_name = payload.full_name.strip()

    if len(normalized_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must contain at least 2 characters.",
        )

    existing_user = database.scalar(
        select(User).where(
            User.email == normalized_email,
            User.id != current_user.id,
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    old_email = current_user.email
    old_name = current_user.full_name

    current_user.full_name = normalized_name
    current_user.email = normalized_email

    create_audit_log(
        database,
        user_id=current_user.id,
        action="profile.updated",
        resource_type="user",
        resource_id=current_user.id,
        description="Account profile information was updated.",
        details={
            "old_name": old_name,
            "new_name": normalized_name,
            "old_email": old_email,
            "new_email": normalized_email,
        },
    )

    try:
        database.commit()
        database.refresh(current_user)
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return current_user


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    payload: PasswordChange,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    if not verify_password(
        payload.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("New password must be different from the current password."),
        )

    current_user.hashed_password = hash_password(payload.new_password)

    create_audit_log(
        database,
        user_id=current_user.id,
        action="password.changed",
        resource_type="user",
        resource_id=current_user.id,
        description="Account password was changed.",
    )

    database.commit()

    return MessageResponse(message="Password changed successfully.")


@router.get(
    "/statistics",
    response_model=AccountStatisticsResponse,
)
def get_account_statistics(
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountStatisticsResponse:
    total_websites = database.scalar(
        select(func.count(Website.id)).where(Website.user_id == current_user.id)
    )

    active_websites = database.scalar(
        select(func.count(Website.id)).where(
            Website.user_id == current_user.id,
            Website.is_active.is_(True),
        )
    )

    total_health_checks = database.scalar(
        select(func.count(MonitorCheck.id))
        .join(
            Website,
            MonitorCheck.website_id == Website.id,
        )
        .where(Website.user_id == current_user.id)
    )

    total_incidents = database.scalar(
        select(func.count(Incident.id))
        .join(
            Website,
            Incident.website_id == Website.id,
        )
        .where(Website.user_id == current_user.id)
    )

    total_activities = database.scalar(
        select(func.count(AuditLog.id)).where(AuditLog.user_id == current_user.id)
    )

    last_activity_at = database.scalar(
        select(AuditLog.created_at)
        .where(AuditLog.user_id == current_user.id)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .limit(1)
    )

    return AccountStatisticsResponse(
        total_websites=total_websites or 0,
        active_websites=active_websites or 0,
        total_health_checks=total_health_checks or 0,
        total_incidents=total_incidents or 0,
        total_activities=total_activities or 0,
        last_activity_at=last_activity_at,
    )
