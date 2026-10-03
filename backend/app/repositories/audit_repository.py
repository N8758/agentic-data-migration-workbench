from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # CREATE
    # ============================================================

    async def create(
        self,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        data = {
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
            "actor": user_id or "system",
            "created_at": datetime.now(timezone.utc),
        }

        audit = AuditLog(**data)

        self.db.add(audit)

        await self.db.commit()
        await self.db.refresh(audit)

        return audit

    # ============================================================
    # GET BY ID
    # ============================================================

    async def get_by_id(
        self,
        audit_id: str,
    ) -> AuditLog | None:

        result = await self.db.execute(
            select(AuditLog).where(
                AuditLog.id == audit_id
            )
        )

        return result.scalar_one_or_none()

    # ============================================================
    # GET ALL
    # ============================================================

    async def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:

        result = await self.db.execute(
            select(AuditLog)
            .order_by(
                AuditLog.created_at.desc()
            )
            .offset(offset)
            .limit(limit)
        )

        return list(result.scalars().all())

    # ============================================================
    # GET BY ENTITY
    # ============================================================

    async def get_by_entity(
        self,
        entity_type: str,
        entity_id: str,
    ) -> list[AuditLog]:

        result = await self.db.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(
                AuditLog.created_at.desc()
            )
        )

        return list(result.scalars().all())

    # ============================================================
    # GET BY ACTION
    # ============================================================

    async def get_by_action(
        self,
        action: str,
        limit: int = 100,
    ) -> list[AuditLog]:

        result = await self.db.execute(
            select(AuditLog)
            .where(
                AuditLog.action == action
            )
            .order_by(
                AuditLog.created_at.desc()
            )
            .limit(limit)
        )

        return list(result.scalars().all())

    # ============================================================
    # GET BY USER
    # ============================================================

    async def get_by_user(
        self,
        user_id: str,
        limit: int = 100,
    ) -> list[AuditLog]:

        result = await self.db.execute(
            select(AuditLog)
            .where(
                AuditLog.user_id == user_id
            )
            .order_by(
                AuditLog.created_at.desc()
            )
            .limit(limit)
        )

        return list(result.scalars().all())

    # ============================================================
    # PLAN CREATED
    # ============================================================

    async def log_plan_created(
        self,
        plan_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="plan_created",
            entity_type="migration_plan",
            entity_id=plan_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # PLAN APPROVED
    # ============================================================

    async def log_plan_approved(
        self,
        plan_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="plan_approved",
            entity_type="migration_plan",
            entity_id=plan_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # DRY RUN
    # ============================================================

    async def log_dry_run(
        self,
        run_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="dry_run",
            entity_type="migration_run",
            entity_id=run_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # EXECUTION
    # ============================================================

    async def log_execution(
        self,
        run_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="migration_executed",
            entity_type="migration_run",
            entity_id=run_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # RETRY
    # ============================================================

    async def log_retry(
        self,
        run_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="migration_retry",
            entity_type="migration_run",
            entity_id=run_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # ROLLBACK
    # ============================================================

    async def log_rollback(
        self,
        run_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="migration_rollback",
            entity_type="migration_run",
            entity_id=run_id,
            details=details,
            user_id=user_id,
        )

    # ============================================================
    # APPROVAL
    # ============================================================

    async def log_approval(
        self,
        approval_id: str,
        details: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> AuditLog:

        return await self.create(
            action="approval",
            entity_type="approval",
            entity_id=approval_id,
            details=details,
            user_id=user_id,
        )