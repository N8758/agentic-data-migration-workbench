from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.schemas import router as schemas_router
from app.api.routes.agent import router as agent_router
from app.api.routes.plans import router as plans_router
from app.api.routes.dry_run import router as dry_run_router
from app.api.routes.migration import router as migration_router
from app.api.routes.quarantine import router as quarantine_router
from app.api.routes.reconciliation import router as reconciliation_router
from app.api.routes.history import router as history_router

from app.core.config import settings
from app.core.database import close_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_database()


app = FastAPI(
    title="Agentic Data Migration Workbench",
    description="AI-assisted data migration planning, validation, execution, reconciliation, and rollback system.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(schemas_router, prefix="/api")
app.include_router(agent_router)
app.include_router(plans_router, prefix="/api")
app.include_router(dry_run_router)
app.include_router(migration_router)
app.include_router(quarantine_router)
app.include_router(reconciliation_router)
app.include_router(history_router)


@app.get("/")
async def root():
    return {
        "name": "Agentic Data Migration Workbench",
        "status": "running",
        "version": "1.0.0",
    }