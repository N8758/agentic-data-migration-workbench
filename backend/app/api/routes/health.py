from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import AsyncSessionLocal

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    database_status = "healthy"

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        database_status = "unhealthy"

    overall_status = "healthy" if database_status == "healthy" else "degraded"

    return {
        "status": overall_status,
        "service": "agentic-data-migration-workbench",
        "database": database_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }