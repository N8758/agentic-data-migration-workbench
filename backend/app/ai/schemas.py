from pydantic import BaseModel, Field


class AIFieldMapping(BaseModel):
    source_field: str
    target_field: str
    transformation: str | None = None
    confidence: float = Field(ge=0, le=1)
    risk_level: str
    reasoning: str


class AITransformation(BaseModel):
    name: str
    source_field: str | None = None
    target_field: str | None = None
    description: str
    parameters: dict = Field(default_factory=dict)


class AIRisk(BaseModel):
    level: str
    source_field: str | None = None
    target_field: str | None = None
    description: str
    mitigation: str | None = None


class AIClarificationQuestion(BaseModel):
    question: str
    reason: str
    related_fields: list[str] = Field(default_factory=list)


class MigrationPlanProposal(BaseModel):
    summary: str
    mappings: list[AIFieldMapping] = Field(default_factory=list)
    transformations: list[AITransformation] = Field(default_factory=list)
    risks: list[AIRisk] = Field(default_factory=list)
    clarification_questions: list[AIClarificationQuestion] = Field(
        default_factory=list
    )
    overall_confidence: float = Field(ge=0, le=1)
    assumptions: list[str] = Field(default_factory=list)


class AIValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)