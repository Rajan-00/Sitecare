"""Classify availability from the monitoring probe's perspective."""

from typing import Protocol


class Probe(Protocol):
    status_code: int | None
    is_up: bool


def check_outcome(check: Probe) -> str:
    # Treat denied access and rate limiting as monitoring failures.
    if check.status_code in (401, 403, 429):
        return "down"

    if check.status_code is None and not check.is_up:
        return "unknown"

    return "up" if check.is_up else "down"