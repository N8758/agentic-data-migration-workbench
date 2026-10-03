from uuid import UUID

from pydantic import BaseModel, Field


class FieldMappingCreate(BaseModel):
    source_field: str = Field(min_length=1, max_length=255)
    target_field: str = Field(min_length=1, max_length=255)
    transformation: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    risk_level: str | None = Field(default=None, max_length=30)
    reasoning: str | None = None


class FieldMappingResponse(FieldMappingCreate):
    id: UUID
    plan_version_id: UUID


class MappingRisk(BaseModel):
    source_field: str | None = None
    target_field: str | None = None
    risk_level: str
    description: str


class ClarificationQuestion(BaseModel):
    question: str = Field(min_length=1)
    related_fields: list[str] = Field(default_factory=list)
    reason: str


class MappingProposal(BaseModel):
    mappings: list[FieldMappingCreate] = Field(default_factory=list)
    transformations: list[dict] = Field(default_factory=list)
    risks: list[MappingRisk] = Field(default_factory=list)
    clarification_questions: list[ClarificationQuestion] = Field(
        default_factory=list
    )
    overall_confidence: float = Field(ge=0, le=1)