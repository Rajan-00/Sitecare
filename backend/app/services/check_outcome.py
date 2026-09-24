"""Interpret a probe result without claiming a blocked probe is an outage."""

from typing import Protocol


class Probe(Protocol):
    status_code: int | None
    is_up: bool


def check_outcome(check: Probe) -> str:
    # A login wall, bot challenge, or rate limit says nothing about whether
    # the service works for its users. This also handles existing saved checks.
    if check.status_code in (401, 403, 429):
        return "blocked"
    if check.status_code is None and not check.is_up:
        return "unknown"
    return "up" if check.is_up else "down"
