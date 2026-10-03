import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MigrationPlanVersion(Base):
    __tablename__ = "migration_plan_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("migration_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(
        nullable=False,
    )
    source_schema: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )
    target_schema: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )
    mappings: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )
    transformations: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )
    risks: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )
    clarification_questions: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )
    ai_provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    ai_model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
    )
    approved_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    plan = relationship(
        "MigrationPlan",
        back_populates="versions",
    )

    runs = relationship(
        "MigrationRun",
        back_populates="plan_version",
    )


class FieldMapping(Base):
    __tablename__ = "field_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    plan_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("migration_plan_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_field: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    target_field: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    transformation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    confidence: Mapped[float | None] = mapped_column(
        nullable=True,
    )
    risk_level: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )
    reasoning: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )