from dataclasses import dataclass
from time import perf_counter

import httpx


@dataclass
class CheckResult:
    status_code: int | None
    response_time_ms: float | None
    is_up: bool
    error_message: str | None
    checked_url: str


async def check_website(url: str) -> CheckResult:
    timeout = httpx.Timeout(10.0)

    headers = {
        "User-Agent": "SiteCare-AI-Monitor/0.3",
        "Accept": "text/html,application/xhtml+xml,application/json",
    }

    started_at = perf_counter()

    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers=headers,
        ) as client:
            response = await client.get(url)

        response_time_ms = round(
            (perf_counter() - started_at) * 1000,
            2,
        )

        return CheckResult(
            status_code=response.status_code,
            response_time_ms=response_time_ms,
            is_up=200 <= response.status_code < 400,
            error_message=None,
            checked_url=str(response.url),
        )

    except httpx.TimeoutException:
        response_time_ms = round(
            (perf_counter() - started_at) * 1000,
            2,
        )

        return CheckResult(
            status_code=None,
            response_time_ms=response_time_ms,
            is_up=False,
            error_message="The website request timed out.",
            checked_url=url,
        )

    except httpx.RequestError as error:
        response_time_ms = round(
            (perf_counter() - started_at) * 1000,
            2,
        )

        return CheckResult(
            status_code=None,
            response_time_ms=response_time_ms,
            is_up=False,
            error_message=f"Connection error: {type(error).__name__}",
            checked_url=url,
        )
