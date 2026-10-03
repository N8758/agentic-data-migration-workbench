from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReconciliationRequest(BaseModel):
    run_id: UUID


class ReconciliationResponse(BaseModel):
    id: UUID
    migration_run_id: UUID
    expected_count: int = Field(ge=0)
    actual_count: int = Field(ge=0)
    difference: int
    status: str
    details: dict | None = None
    created_at: datetime


class ReconciliationSummary(BaseModel):
    run_id: UUID
    source_count: int
    accepted_count: int
    rejected_count: int
    target_count: int
    difference: int
    status: str