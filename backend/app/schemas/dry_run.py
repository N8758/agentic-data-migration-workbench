from uuid import UUID

from pydantic import BaseModel, Field


class DryRunRequest(BaseModel):
    plan_id: UUID
    plan_version_id: UUID


class RecordValidationError(BaseModel):
    field_name: str | None = None
    error_code: str
    error_message: str
    source_value: object | None = None


class DryRunRecordResult(BaseModel):
    source_record_id: str
    status: str
    source_data: dict
    transformed_data: dict | None = None
    errors: list[RecordValidationError] = Field(default_factory=list)


class DryRunSummary(BaseModel):
    run_id: UUID
    source_count: int
    transformed_count: int
    accepted_count: int
    rejected_count: int
    duplicate_count: int
    quarantined_count: int


class DryRunResponse(BaseModel):
    summary: DryRunSummary
    records: list[DryRunRecordResult] = Field(default_factory=list)