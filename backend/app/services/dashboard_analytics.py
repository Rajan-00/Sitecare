from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monitor_check import MonitorCheck
from app.models.website import Website
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    WebsiteMetricResponse,
)


def calculate_uptime(checks: list[MonitorCheck]) -> float:
    if not checks:
        return 0.0

    successful_checks = sum(check.is_up for check in checks)

    return round(
        successful_checks / len(checks) * 100,
        2,
    )


def calculate_average_response_time(
    checks: list[MonitorCheck],
) -> float | None:
    response_times = [
        check.response_time_ms for check in checks if check.response_time_ms is not None
    ]

    if not response_times:
        return None

    return round(
        sum(response_times) / len(response_times),
        2,
    )


def calculate_performance_score(
    average_response_time_ms: float | None,
) -> float:
    if average_response_time_ms is None:
        return 0.0

    if average_response_time_ms <= 500:
        return 100.0

    if average_response_time_ms >= 5000:
        return 0.0

    score = (5000 - average_response_time_ms) / (5000 - 500) * 100

    return round(score, 2)


def calculate_health_score(
    uptime_percentage: float,
    average_response_time_ms: float | None,
) -> float:
    performance_score = calculate_performance_score(average_response_time_ms)

    health_score = uptime_percentage * 0.70 + performance_score * 0.30

    return round(health_score, 2)


def get_current_status(
    latest_check: MonitorCheck | None,
) -> str:
    if latest_check is None:
        return "not_checked"

    if latest_check.is_up:
        return "up"

    return "down"


def load_dashboard_data(
    database: Session,
) -> tuple[list[Website], dict[int, list[MonitorCheck]]]:
    websites_statement = select(Website).order_by(Website.id)

    checks_statement = select(MonitorCheck).order_by(MonitorCheck.checked_at)

    websites = list(database.scalars(websites_statement).all())
    checks = list(database.scalars(checks_statement).all())

    checks_by_website: dict[int, list[MonitorCheck]] = defaultdict(list)

    for check in checks:
        checks_by_website[check.website_id].append(check)

    return websites, checks_by_website


def build_website_metrics(
    database: Session,
) -> list[WebsiteMetricResponse]:
    websites, checks_by_website = load_dashboard_data(database)

    metrics: list[WebsiteMetricResponse] = []

    for website in websites:
        website_checks = checks_by_website.get(
            website.id,
            [],
        )

        latest_check = website_checks[-1] if website_checks else None

        successful_checks = sum(check.is_up for check in website_checks)
        failed_checks = len(website_checks) - successful_checks

        uptime_percentage = calculate_uptime(website_checks)

        average_response_time_ms = calculate_average_response_time(website_checks)

        health_score = calculate_health_score(
            uptime_percentage,
            average_response_time_ms,
        )

        metrics.append(
            WebsiteMetricResponse(
                website_id=website.id,
                website_name=website.name,
                website_url=website.url,
                is_active=website.is_active,
                current_status=get_current_status(latest_check),
                health_score=health_score,
                uptime_percentage=uptime_percentage,
                average_response_time_ms=(average_response_time_ms),
                total_checks=len(website_checks),
                successful_checks=successful_checks,
                failed_checks=failed_checks,
                latest_status_code=(latest_check.status_code if latest_check else None),
                last_checked_at=(latest_check.checked_at if latest_check else None),
            )
        )

    return metrics


def build_dashboard_summary(
    database: Session,
) -> DashboardSummaryResponse:
    websites, checks_by_website = load_dashboard_data(database)

    all_checks = [
        check for website_checks in checks_by_website.values() for check in website_checks
    ]

    websites_up = 0
    websites_down = 0
    websites_not_checked = 0

    for website in websites:
        website_checks = checks_by_website.get(
            website.id,
            [],
        )

        latest_check = website_checks[-1] if website_checks else None

        current_status = get_current_status(latest_check)

        if current_status == "up":
            websites_up += 1
        elif current_status == "down":
            websites_down += 1
        else:
            websites_not_checked += 1

    total_incidents = sum(not check.is_up for check in all_checks)

    return DashboardSummaryResponse(
        total_websites=len(websites),
        active_websites=sum(website.is_active for website in websites),
        websites_up=websites_up,
        websites_down=websites_down,
        websites_not_checked=websites_not_checked,
        total_checks=len(all_checks),
        total_incidents=total_incidents,
        overall_uptime_percentage=calculate_uptime(all_checks),
        average_response_time_ms=(calculate_average_response_time(all_checks)),
    )
