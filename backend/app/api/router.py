from fastapi import APIRouter

from app.api.routes.anomalies import router as anomalies_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.monitoring import router as monitoring_router
from app.api.routes.notifications import (
    router as notifications_router,
)
from app.api.routes.predictions import (
    router as predictions_router,
)
from app.api.routes.reports import (
    router as reports_router,
)
from app.api.routes.websites import router as websites_router

api_router = APIRouter()

api_router.include_router(
    health_router,
    tags=["Health"],
)

api_router.include_router(
    websites_router,
    prefix="/websites",
    tags=["Websites"],
)

api_router.include_router(
    monitoring_router,
    prefix="/monitoring",
    tags=["Monitoring"],
)

api_router.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"],
)

api_router.include_router(
    incidents_router,
    prefix="/incidents",
    tags=["Incidents"],
)

api_router.include_router(
    anomalies_router,
    prefix="/anomalies",
    tags=["Anomalies"],
)

api_router.include_router(
    predictions_router,
    prefix="/predictions",
    tags=["Maintenance Predictions"],
)

api_router.include_router(
    notifications_router,
    prefix="/notifications",
    tags=["Notifications"],
)

api_router.include_router(
    reports_router,
    prefix="/reports",
    tags=["Reports"],
)
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)
