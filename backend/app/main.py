import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.services.monitoring_scheduler import (
    start_monitoring_scheduler,
    stop_monitoring_scheduler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.scheduler_enabled:
        start_monitoring_scheduler()

    yield

    if settings.scheduler_enabled:
        stop_monitoring_scheduler()


app = FastAPI(
    title=settings.app_name,
    version="0.4.0",
    description=("Website health monitoring, anomaly detection and maintenance prediction API."),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "SiteCare AI API is running.",
        "documentation": "/docs",
    }
