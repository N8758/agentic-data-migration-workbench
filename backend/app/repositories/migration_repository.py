from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.migration_run import MigrationRun
from app.models.migration_record import MigrationRecord
from app.models.quarantine import QuarantineRecord


class MigrationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # MIGRATION RUN
    # ============================================================

    async def create_run(
        self,
        data: dict[str, Any],
    ) -> MigrationRun:
        run = MigrationRun(**data)

        self.db.add(run)

        await self.db.commit()
        await self.db.refresh(run)

        return run

    async def get_run(
        self,
        run_id: str,
    ) -> MigrationRun | None:
        result = await self.db.execute(
            select(MigrationRun).where(
                MigrationRun.id == run_id
            )
        )

        return result.scalar_one_or_none()

    async def get_runs(
        self,
    ) -> list[MigrationRun]:
        result = await self.db.execute(
            select(MigrationRun).order_by(
                MigrationRun.created_at.desc()
            )
        )

        return list(result.scalars().all())

    async def update_run(
        self,
        run_id: str,
        data: dict[str, Any],
    ) -> MigrationRun | None:
        run = await self.get_run(run_id)

        if run is None:
            return None

        for key, value in data.items():
            if hasattr(run, key):
                setattr(run, key, value)

        await self.db.commit()
        await self.db.refresh(run)

        return run

    # ============================================================
    # MIGRATION RECORDS
    # ============================================================

    async def create_record(
        self,
        data: dict[str, Any],
    ) -> MigrationRecord:
        record = MigrationRecord(**data)

        self.db.add(record)

        await self.db.commit()
        await self.db.refresh(record)

        return record

    async def create_records(
        self,
        records: list[dict[str, Any]],
    ) -> list[MigrationRecord]:
        objects = [
            MigrationRecord(**record)
            for record in records
        ]

        if objects:
            self.db.add_all(objects)

            await self.db.commit()

            for obj in objects:
                await self.db.refresh(obj)

        return objects

    async def get_records(
        self,
        run_id: str,
    ) -> list[MigrationRecord]:
        result = await self.db.execute(
            select(MigrationRecord)
            .where(
                MigrationRecord.migration_run_id == run_id
            )
            .order_by(
                MigrationRecord.created_at.asc()
            )
        )

        return list(result.scalars().all())

    # ============================================================
    # QUARANTINE
    # ============================================================

    async def create_quarantine(
        self,
        data: dict[str, Any],
    ) -> QuarantineRecord:
        record = QuarantineRecord(**data)

        self.db.add(record)

        await self.db.commit()
        await self.db.refresh(record)

        return record

    async def create_quarantine_records(
        self,
        records: list[dict[str, Any]],
    ) -> list[QuarantineRecord]:
        objects = [
            QuarantineRecord(**record)
            for record in records
        ]

        if objects:
            self.db.add_all(objects)

            await self.db.commit()

            for obj in objects:
                await self.db.refresh(obj)

        return objects

    async def get_quarantine(
        self,
        run_id: str,
    ) -> list[QuarantineRecord]:
        result = await self.db.execute(
            select(QuarantineRecord)
            .where(
                QuarantineRecord.migration_run_id == run_id
            )
            .order_by(
                QuarantineRecord.created_at.asc()
            )
        )

        return list(result.scalars().all())

    async def get_quarantine_by_id(
        self,
        quarantine_id: str,
    ) -> QuarantineRecord | None:
        result = await self.db.execute(
            select(QuarantineRecord).where(
                QuarantineRecord.id == quarantine_id
            )
        )

        return result.scalar_one_or_none()

    async def update_quarantine(
        self,
        quarantine_id: str,
        data: dict[str, Any],
    ) -> QuarantineRecord | None:
        record = await self.get_quarantine_by_id(
            quarantine_id
        )

        if record is None:
            return None

        for key, value in data.items():
            if hasattr(record, key):
                setattr(record, key, value)

        await self.db.commit()
        await self.db.refresh(record)

        return record

    # ============================================================
    # COUNTS
    # ============================================================

    async def get_run_counts(
        self,
        run_id: str,
    ) -> dict[str, int]:
        records = await self.get_records(run_id)
        quarantine = await self.get_quarantine(run_id)

        accepted_count = sum(
            1
            for record in records
            if getattr(record, "status", None)
            == "accepted"
        )

        rejected_count = sum(
            1
            for record in records
            if getattr(record, "status", None)
            == "rejected"
        )

        return {
            "total_records": len(records),
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "quarantined_count": len(quarantine),
        }

    # ============================================================
    # STATUS HELPERS
    # ============================================================

    async def mark_run_completed(
        self,
        run_id: str,
    ) -> MigrationRun | None:
        return await self.update_run(
            run_id,
            {
                "status": "completed",
            },
        )

    async def mark_run_failed(
        self,
        run_id: str,
    ) -> MigrationRun | None:
        return await self.update_run(
            run_id,
            {
                "status": "failed",
            },
        )

    async def mark_run_rolled_back(
        self,
        run_id: str,
    ) -> MigrationRun | None:
        return await self.update_run(
            run_id,
            {
                "status": "rolled_back",
            },
        )