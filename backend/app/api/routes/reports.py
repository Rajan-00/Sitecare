from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.services.report_generator import (
    generate_website_csv,
    generate_website_pdf,
)

router = APIRouter()


def get_report_data(
    website_id: int,
    database: Session,
) -> tuple[Website, list[MonitorCheck]]:
    website = database.get(
        Website,
        website_id,
    )

    if website is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Website not found.",
        )

    statement = (
        select(MonitorCheck)
        .where(MonitorCheck.website_id == website_id)
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
    database: Session = Depends(get_db),
) -> StreamingResponse:
    website, checks = get_report_data(
        website_id,
        database,
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
    database: Session = Depends(get_db),
) -> StreamingResponse:
    website, checks = get_report_data(
        website_id,
        database,
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
