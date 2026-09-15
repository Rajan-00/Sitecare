import csv
from datetime import datetime
from io import BytesIO, StringIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.monitor_check import MonitorCheck
from app.models.website import Website


def format_datetime(
    value: datetime | None,
) -> str:
    if value is None:
        return "Not available"

    return value.strftime("%Y-%m-%d %H:%M:%S")


def calculate_summary(
    checks: list[MonitorCheck],
) -> dict[str, float | int | None]:
    total_checks = len(checks)

    successful_checks = sum(check.is_up for check in checks)

    failed_checks = total_checks - successful_checks

    anomaly_count = sum(check.is_anomaly for check in checks)

    response_times = [
        check.response_time_ms for check in checks if check.response_time_ms is not None
    ]

    uptime_percentage = successful_checks / total_checks * 100 if total_checks else 0.0

    average_response_time = sum(response_times) / len(response_times) if response_times else None

    return {
        "total_checks": total_checks,
        "successful_checks": successful_checks,
        "failed_checks": failed_checks,
        "anomaly_count": anomaly_count,
        "uptime_percentage": round(
            uptime_percentage,
            2,
        ),
        "average_response_time_ms": (
            round(average_response_time, 2) if average_response_time is not None else None
        ),
    }


def generate_website_csv(
    website: Website,
    checks: list[MonitorCheck],
) -> bytes:
    output = StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "Website Name",
            "Website URL",
            "Check ID",
            "Checked At",
            "Status",
            "HTTP Status",
            "Response Time (ms)",
            "AI Anomaly",
            "Anomaly Score",
            "Anomaly Reason",
            "Error",
            "Checked URL",
        ]
    )

    for check in checks:
        writer.writerow(
            [
                website.name,
                website.url,
                check.id,
                format_datetime(check.checked_at),
                "Operational" if check.is_up else "Down",
                check.status_code or "",
                check.response_time_ms or "",
                "Yes" if check.is_anomaly else "No",
                check.anomaly_score if check.anomaly_score is not None else "",
                check.anomaly_reason or "",
                check.error_message or "",
                check.checked_url,
            ]
        )

    return output.getvalue().encode("utf-8-sig")


def generate_website_pdf(
    website: Website,
    checks: list[MonitorCheck],
) -> bytes:
    output = BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=landscape(A4),
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        title=f"{website.name} Health Report",
        author="SiteCare AI",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "SiteCareTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=27,
        textColor=colors.HexColor("#172033"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "SiteCareSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#687386"),
        alignment=TA_CENTER,
    )

    body_style = ParagraphStyle(
        "SiteCareBody",
        parent=styles["Normal"],
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#354056"),
    )

    story = [
        Paragraph(
            "SiteCare AI Website Health Report",
            title_style,
        ),
        Paragraph(
            (
                f"<b>Website:</b> {escape(website.name)}"
                f" &nbsp;&nbsp; "
                f"<b>URL:</b> {escape(website.url)}"
                f" &nbsp;&nbsp; "
                f"<b>Generated:</b> "
                f"{format_datetime(datetime.now())}"
            ),
            subtitle_style,
        ),
        Spacer(1, 8 * mm),
    ]

    summary = calculate_summary(checks)

    average_response = summary["average_response_time_ms"]

    summary_data = [
        [
            "Total Checks",
            "Operational",
            "Failed",
            "Uptime",
            "Average Response",
            "AI Anomalies",
        ],
        [
            str(summary["total_checks"]),
            str(summary["successful_checks"]),
            str(summary["failed_checks"]),
            f"{summary['uptime_percentage']}%",
            (f"{average_response} ms" if average_response is not None else "Not available"),
            str(summary["anomaly_count"]),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[35 * mm] * 6,
    )

    summary_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#172033"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "BACKGROUND",
                    (0, 1),
                    (-1, 1),
                    colors.HexColor("#F5F7FB"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 1),
                    (-1, 1),
                    colors.HexColor("#273146"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTNAME",
                    (0, 1),
                    (-1, 1),
                    "Helvetica-Bold",
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "CENTER",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.HexColor("#DDE2EA"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.extend(
        [
            summary_table,
            Spacer(1, 8 * mm),
            Paragraph(
                "Monitoring History",
                styles["Heading2"],
            ),
            Spacer(1, 3 * mm),
        ]
    )

    history_data: list[list[object]] = [
        [
            "Checked At",
            "Status",
            "HTTP",
            "Response",
            "AI Result",
            "Information",
        ]
    ]

    for check in checks:
        information = check.anomaly_reason or check.error_message or "Normal monitoring result"

        history_data.append(
            [
                format_datetime(check.checked_at),
                ("Operational" if check.is_up else "Down"),
                (str(check.status_code) if check.status_code is not None else "—"),
                (f"{check.response_time_ms:.2f} ms" if check.response_time_ms is not None else "—"),
                ("Anomaly" if check.is_anomaly else "Normal"),
                Paragraph(
                    escape(information),
                    body_style,
                ),
            ]
        )

    history_table = Table(
        history_data,
        repeatRows=1,
        colWidths=[
            34 * mm,
            25 * mm,
            18 * mm,
            27 * mm,
            23 * mm,
            100 * mm,
        ],
    )

    history_style = [
        (
            "BACKGROUND",
            (0, 0),
            (-1, 0),
            colors.HexColor("#4263EB"),
        ),
        (
            "TEXTCOLOR",
            (0, 0),
            (-1, 0),
            colors.white,
        ),
        (
            "FONTNAME",
            (0, 0),
            (-1, 0),
            "Helvetica-Bold",
        ),
        (
            "FONTSIZE",
            (0, 0),
            (-1, -1),
            7,
        ),
        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            "MIDDLE",
        ),
        (
            "GRID",
            (0, 0),
            (-1, -1),
            0.3,
            colors.HexColor("#DDE2EA"),
        ),
        (
            "TOPPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
    ]

    for row_index in range(
        1,
        len(history_data),
    ):
        if row_index % 2 == 0:
            history_style.append(
                (
                    "BACKGROUND",
                    (0, row_index),
                    (-1, row_index),
                    colors.HexColor("#F7F9FC"),
                )
            )

    history_table.setStyle(TableStyle(history_style))

    story.append(history_table)

    document.build(story)

    return output.getvalue()
