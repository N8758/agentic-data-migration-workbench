from uuid import UUID

from pydantic import BaseModel, Field


class MigrationExecutionRequest(BaseModel):
    plan_id: UUID
    plan_version_id: UUID
    approved_by: str = Field(min_length=1, max_length=255)


class MigrationRetryRequest(BaseModel):
    run_id: UUID
    requested_by: str = Field(min_length=1, max_length=255)


class MigrationRollbackRequest(BaseModel):
    run_id: UUID
    requested_by: str = Field(min_length=1, max_length=255)
    reason: str = Field(min_length=1)


class MigrationExecutionResponse(BaseModel):
    run_id: UUID
    status: str
    source_count: int
    transformed_count: int
    accepted_count: int
    rejected_count: int
    duplicate_count: int
    inserted_count: int
    message: str


class MigrationRollbackResponse(BaseModel):
    run_id: UUID
    status: str
    rolled_back_count: int
    message: str