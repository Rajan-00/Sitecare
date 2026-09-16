import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def unexpected_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    request_id = getattr(
        request.state,
        "request_id",
        "unknown",
    )

    logger.exception(
        "Unexpected API error | request_id=%s | method=%s | path=%s",
        request_id,
        request.method,
        request.url.path,
        exc_info=exception,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": ("An unexpected server error occurred."),
            "request_id": request_id,
        },
        headers={
            "X-Request-ID": request_id,
        },
    )
