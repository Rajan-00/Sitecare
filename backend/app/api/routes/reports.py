from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    CurrentUserDependency,
)
from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.access_control import (
    get_owned_website,
)
from app.services.report_generator import (
    generate_website_csv,
    generate_website_pdf,
)

router = APIRouter()


def get_report_data(
    website_id: int,
    database: Session,
    current_user: CurrentUserDependency,
) -> tuple[Website, list[MonitorCheck]]:
    website = get_owned_website(
        database,
        current_user,
        website_id,
    )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website.id)
        .order_by(MonitorCheck.checked_at.desc())
        .limit(1000)
    )

    checks = list(database.scalars(statement).all())

    return website, checks


def safe_filename(value: str) -> str:
    cleaned = "".join(character if character.isalnum() else "-" for character in value.lower())

    return "-".join(part for part in cleaned.split("-") if part)


@router.get("/websites/{website_id}/pdf")
def download_website_pdf(
    website_id: int,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> StreamingResponse:
    website, checks = get_report_data(
        website_id,
        database,
        current_user,
    )

    content = generate_website_pdf(
        website,
        checks,
    )

    filename = f"{safe_filename(website.name)}-health-report.pdf"

    return StreamingResponse(
        BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": (f'attachment; filename="{filename}"')},
    )


@router.get("/websites/{website_id}/csv")
def download_website_csv(
    website_id: int,
    current_user: CurrentUserDependency,
    database: Session = Depends(get_db),
) -> StreamingResponse:
    website, checks = get_report_data(
        website_id,
        database,
        current_user,
    )

    content = generate_website_csv(
        website,
        checks,
    )

    filename = f"{safe_filename(website.name)}-monitoring-history.csv"

    return StreamingResponse(
        BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": (f'attachment; filename="{filename}"')},
    )
