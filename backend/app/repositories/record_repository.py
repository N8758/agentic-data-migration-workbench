from typing import Any

from sqlalchemy.orm import Session

from app.models.migration_record import MigrationRecord


class RecordRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        data: dict[str, Any],
    ) -> MigrationRecord:
        record = MigrationRecord(**data)

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return record

    def create_many(
        self,
        records: list[dict[str, Any]],
    ) -> list[MigrationRecord]:
        objects = [
            MigrationRecord(**record)
            for record in records
        ]

        if not objects:
            return []

        self.db.add_all(objects)
        self.db.commit()

        for record in objects:
            self.db.refresh(record)

        return objects

    def get_by_id(
        self,
        record_id: str,
    ) -> MigrationRecord | None:
        return (
            self.db.query(MigrationRecord)
            .filter(
                MigrationRecord.id == record_id
            )
            .first()
        )

    def get_by_run(
        self,
        migration_run_id: str,
    ) -> list[MigrationRecord]:
        return (
            self.db.query(MigrationRecord)
            .filter(
                MigrationRecord.migration_run_id
                == migration_run_id
            )
            .order_by(
                MigrationRecord.created_at.asc()
            )
            .all()
        )

    def get_by_status(
        self,
        migration_run_id: str,
        status: str,
    ) -> list[MigrationRecord]:
        return (
            self.db.query(MigrationRecord)
            .filter(
                MigrationRecord.migration_run_id
                == migration_run_id,
                MigrationRecord.status == status,
            )
            .order_by(
                MigrationRecord.created_at.asc()
            )
            .all()
        )

    def update(
        self,
        record_id: str,
        data: dict[str, Any],
    ) -> MigrationRecord | None:
        record = self.get_by_id(record_id)

        if record is None:
            return None

        for key, value in data.items():
            if hasattr(record, key):
                setattr(record, key, value)

        self.db.commit()
        self.db.refresh(record)

        return record

    def delete(
        self,
        record_id: str,
    ) -> bool:
        record = self.get_by_id(record_id)

        if record is None:
            return False

        self.db.delete(record)
        self.db.commit()

        return True

    def delete_by_run(
        self,
        migration_run_id: str,
    ) -> int:
        records = self.get_by_run(migration_run_id)

        count = len(records)

        for record in records:
            self.db.delete(record)

        self.db.commit()

        return count

    def count_by_run(
        self,
        migration_run_id: str,
    ) -> int:
        return (
            self.db.query(MigrationRecord)
            .filter(
                MigrationRecord.migration_run_id
                == migration_run_id
            )
            .count()
        )

    def count_by_status(
        self,
        migration_run_id: str,
        status: str,
    ) -> int:
        return (
            self.db.query(MigrationRecord)
            .filter(
                MigrationRecord.migration_run_id
                == migration_run_id,
                MigrationRecord.status == status,
            )
            .count()
        )

    def get_summary(
        self,
        migration_run_id: str,
    ) -> dict[str, int]:
        total = self.count_by_run(
            migration_run_id
        )

        accepted = self.count_by_status(
            migration_run_id,
            "accepted",
        )

        rejected = self.count_by_status(
            migration_run_id,
            "rejected",
        )

        transformed = self.count_by_status(
            migration_run_id,
            "transformed",
        )

        return {
            "total": total,
            "accepted": accepted,
            "rejected": rejected,
            "transformed": transformed,
        }