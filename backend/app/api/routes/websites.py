from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.website import Website
from app.schemas.website import (
    WebsiteCreate,
    WebsiteResponse,
    WebsiteUpdate,
)
from app.services.audit import create_audit_log

router = APIRouter()


def get_owned_website(
    database: Session,
    current_user: User,
    website_id: int,
) -> Website:
    website = database.scalar(
        select(Website).where(
            Website.id == website_id,
            Website.user_id == current_user.id,
        )
    )

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    return website


def ensure_unique_website_url(
    database: Session,
    current_user: User,
    url: str,
    exclude_website_id: int | None = None,
) -> None:
    query = select(Website).where(
        Website.user_id == current_user.id,
        Website.url == url,
    )

    if exclude_website_id is not None:
        query = query.where(Website.id != exclude_website_id)

    existing_website = database.scalar(query)

    if existing_website is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already monitoring this website.",
        )


@router.get(
    "",
    response_model=list[WebsiteResponse],
)
def list_websites(
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Website]:
    websites = database.scalars(
        select(Website)
        .where(Website.user_id == current_user.id)
        .order_by(Website.created_at.desc())
    ).all()

    return list(websites)


@router.post(
    "",
    response_model=WebsiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_website(
    payload: WebsiteCreate,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Website:
    website_data = payload.model_dump(mode="json")

    website_url = str(website_data["url"])

    ensure_unique_website_url(
        database=database,
        current_user=current_user,
        url=website_url,
    )

    website = Website(
        **website_data,
        user_id=current_user.id,
    )

    database.add(website)

    try:
        # Generate the website ID before creating its audit record.
        database.flush()

        create_audit_log(
            database,
            user_id=current_user.id,
            action="website.created",
            resource_type="website",
            resource_id=website.id,
            description=(f'Website "{website.name}" was added.'),
            details={
                "name": website.name,
                "url": website.url,
                "is_active": website.is_active,
            },
        )

        database.commit()
        database.refresh(website)
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This website already exists.",
        ) from None

    return website


@router.get(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def get_website(
    website_id: int,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Website:
    return get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )


@router.patch(
    "/{website_id}",
    response_model=WebsiteResponse,
)
def update_website(
    website_id: int,
    payload: WebsiteUpdate,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Website:
    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    update_data = payload.model_dump(
        mode="json",
        exclude_unset=True,
    )

    if not update_data:
        return website

    if "url" in update_data:
        normalized_url = str(update_data["url"])

        ensure_unique_website_url(
            database=database,
            current_user=current_user,
            url=normalized_url,
            exclude_website_id=website.id,
        )

        update_data["url"] = normalized_url

    changed_fields: dict[str, dict[str, object]] = {}

    for field_name, new_value in update_data.items():
        old_value = getattr(website, field_name)

        if old_value != new_value:
            changed_fields[field_name] = {
                "old": old_value,
                "new": new_value,
            }

            setattr(website, field_name, new_value)

    if not changed_fields:
        return website

    if "is_active" in changed_fields and changed_fields["is_active"]["new"] is True:
        audit_action = "website.enabled"
        audit_description = f'Website "{website.name}" was enabled.'
    elif "is_active" in changed_fields and changed_fields["is_active"]["new"] is False:
        audit_action = "website.disabled"
        audit_description = f'Website "{website.name}" was disabled.'
    else:
        audit_action = "website.updated"
        audit_description = f'Website "{website.name}" was updated.'

    create_audit_log(
        database,
        user_id=current_user.id,
        action=audit_action,
        resource_type="website",
        resource_id=website.id,
        description=audit_description,
        details={
            "website_name": website.name,
            "changes": changed_fields,
        },
    )

    try:
        database.commit()
        database.refresh(website)
    except IntegrityError:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("A website with this URL already exists."),
        ) from None

    return website


@router.delete(
    "/{website_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_website(
    website_id: int,
    database: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    website = get_owned_website(
        database=database,
        current_user=current_user,
        website_id=website_id,
    )

    deleted_website_id = website.id
    deleted_website_name = website.name
    deleted_website_url = website.url

    create_audit_log(
        database,
        user_id=current_user.id,
        action="website.deleted",
        resource_type="website",
        resource_id=deleted_website_id,
        description=(f'Website "{deleted_website_name}" was deleted.'),
        details={
            "name": deleted_website_name,
            "url": deleted_website_url,
        },
    )

    database.delete(website)
    database.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
