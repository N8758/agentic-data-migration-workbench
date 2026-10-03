import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MigrationRecord(Base):
    __tablename__ = "migration_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    migration_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("migration_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_record_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    target_record_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    record_hash: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    source_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )
    transformed_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    error_details: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    migration_run = relationship(
        "MigrationRun",
        back_populates="records",
    )