import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MigrationRun(Base):
    __tablename__ = "migration_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("migration_plans.id"),
        nullable=False,
    )
    plan_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("migration_plan_versions.id"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="created",
    )
    source_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    transformed_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    accepted_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    rejected_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    duplicate_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    plan = relationship(
        "MigrationPlan",
        back_populates="runs",
    )

    plan_version = relationship(
        "MigrationPlanVersion",
        back_populates="runs",
    )

    records = relationship(
        "MigrationRecord",
        back_populates="migration_run",
        cascade="all, delete-orphan",
    )

    quarantine_records = relationship(
        "QuarantineRecord",
        back_populates="migration_run",
        cascade="all, delete-orphan",
    )