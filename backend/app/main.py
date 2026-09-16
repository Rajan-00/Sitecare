from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.exception_handlers import (
    unexpected_exception_handler,
)
from app.core.logging import configure_logging
from app.middleware import (
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
)
from app.services.monitoring_scheduler import (
    start_monitoring_scheduler,
    stop_monitoring_scheduler,
)

configure_logging()


@asynccontextmanager
async def lifespan(
    application: FastAPI,
) -> AsyncIterator[None]:
    del application

    scheduler_started = False

    if settings.scheduler_enabled:
        start_monitoring_scheduler()
        scheduler_started = True

    try:
        yield
    finally:
        if scheduler_started:
            stop_monitoring_scheduler()


app = FastAPI(
    title="SiteCare AI API",
    description=(
        "An intelligent website health monitoring, "
        "anomaly detection and predictive maintenance "
        "platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
)

app.add_middleware(
    SecurityHeadersMiddleware,
)

app.add_middleware(
    RequestContextMiddleware,
)

app.add_exception_handler(
    Exception,
    unexpected_exception_handler,
)

app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get(
    "/",
    tags=["Root"],
    include_in_schema=False,
)
def root() -> dict[str, str]:
    return {
        "name": "SiteCare AI API",
        "status": "running",
        "version": "1.0.0",
        "documentation": "/docs",
    }
