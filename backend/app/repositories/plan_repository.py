from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.migration_plan import MigrationPlan


class PlanRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict[str, Any]) -> MigrationPlan:
        plan = MigrationPlan(**data)

        self.db.add(plan)
        await self.db.commit()
        await self.db.refresh(plan)

        return plan

    async def get_by_id(
        self,
        plan_id: str,
    ) -> MigrationPlan | None:
        result = await self.db.execute(
            select(MigrationPlan).where(
                MigrationPlan.id == plan_id
            )
        )

        return result.scalar_one_or_none()

    async def get_all(self) -> list[MigrationPlan]:
        result = await self.db.execute(
            select(MigrationPlan).order_by(
                MigrationPlan.created_at.desc()
            )
        )

        return list(result.scalars().all())

    async def update(
        self,
        plan_id: str,
        data: dict[str, Any],
    ) -> MigrationPlan | None:
        plan = await self.get_by_id(plan_id)

        if plan is None:
            return None

        for key, value in data.items():
            if hasattr(plan, key):
                setattr(plan, key, value)

        await self.db.commit()
        await self.db.refresh(plan)

        return plan

    async def delete(self, plan_id: str) -> bool:
        plan = await self.get_by_id(plan_id)

        if plan is None:
            return False

        await self.db.delete(plan)
        await self.db.commit()

        return True

    async def create_version(
        self,
        plan_data: dict[str, Any],
    ) -> MigrationPlan:
        return await self.create(plan_data)

    async def get_versions(
        self,
        plan_id: str,
    ) -> list[MigrationPlan]:
        plan = await self.get_by_id(plan_id)

        if plan is None:
            return []

        version = getattr(plan, "version", None)

        if version is None:
            return [plan]

        result = await self.db.execute(
            select(MigrationPlan)
            .where(MigrationPlan.version <= version)
            .order_by(MigrationPlan.version.desc())
        )

        return list(result.scalars().all())

    async def approve(
        self,
        plan_id: str,
    ) -> MigrationPlan | None:
        return await self.update(
            plan_id,
            {
                "status": "approved",
            },
        )

    async def reject(
        self,
        plan_id: str,
    ) -> MigrationPlan | None:
        return await self.update(
            plan_id,
            {
                "status": "rejected",
            },
        )

    async def mark_executed(
        self,
        plan_id: str,
    ) -> MigrationPlan | None:
        return await self.update(
            plan_id,
            {
                "status": "executed",
            },
        )