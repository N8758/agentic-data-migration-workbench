from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MigrationPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    source_name: str = Field(min_length=1, max_length=255)
    target_name: str = Field(min_length=1, max_length=255)


class MigrationPlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = None


class MigrationPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    source_name: str
    target_name: str
    current_version: int
    status: str
    created_at: datetime
    updated_at: datetime


class MigrationPlanVersionCreate(BaseModel):
    plan_id: UUID
    version: int = Field(ge=1)
    source_schema: dict
    target_schema: dict
    mappings: list[dict] = Field(default_factory=list)
    transformations: list[dict] = Field(default_factory=list)
    risks: list[dict] = Field(default_factory=list)
    clarification_questions: list[dict] = Field(default_factory=list)
    ai_provider: str | None = None
    ai_model: str | None = None


class MigrationPlanVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    version: int
    source_schema: dict
    target_schema: dict
    mappings: list
    transformations: list
    risks: list
    clarification_questions: list
    ai_provider: str | None
    ai_model: str | None
    status: str
    approved_by: str | None
    approved_at: datetime | None
    created_at: datetime


class MigrationPlanApproval(BaseModel):
    approved_by: str = Field(min_length=1, max_length=255)
    reason: str | None = None


class MigrationPlanRejection(BaseModel):
    rejected_by: str = Field(min_length=1, max_length=255)
    reason: str = Field(min_length=1)


class MigrationRunCreate(BaseModel):
    plan_id: UUID
    plan_version_id: UUID


class MigrationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_id: UUID
    plan_version_id: UUID
    status: str
    source_count: int
    transformed_count: int
    accepted_count: int
    rejected_count: int
    duplicate_count: int
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None
    created_at: datetime