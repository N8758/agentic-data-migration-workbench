from datetime import datetime, timezone
from typing import Any

from app.migration.idempotency import IdempotencyManager
from app.migration.transformer import MigrationTransformer
from app.migration.validator import RecordValidator


class MigrationExecutor:
    def __init__(
        self,
        target_schema: dict[str, Any],
        validation_rules: list[dict[str, Any]] | None = None,
        supported_transformations: dict[str, Any] | None = None,
        target_store: list[dict[str, Any]] | None = None,
        idempotency_manager: IdempotencyManager | None = None,
    ):
        self.target_schema = target_schema
        self.target_store = target_store if target_store is not None else []
        self.idempotency = (
            idempotency_manager
            or IdempotencyManager()
        )

        self.transformer = MigrationTransformer(
            supported_transformations=supported_transformations or {},
        )

        self.validator = RecordValidator(
            target_schema=target_schema,
            validation_rules=validation_rules or [],
        )

        self.execution_history: list[dict[str, Any]] = []

    def execute(
        self,
        source_records: list[dict[str, Any]],
        mappings: list[dict[str, Any]],
        migration_plan_id: str,
        migration_run_id: str | None = None,
    ) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc).isoformat()

        accepted = []
        rejected = []
        inserted = []
        duplicates = []

        for index, source_record in enumerate(source_records):
            try:
                transformed = self.transformer.transform_record(
                    record=source_record,
                    mappings=mappings,
                )

                validation = self.validator.validate_record(
                    transformed
                )

                if not validation["valid"]:
                    rejected.append({
                        "record_index": index,
                        "source_record": source_record,
                        "transformed_record": transformed,
                        "errors": validation["errors"],
                    })
                    continue

                accepted.append({
                    "record_index": index,
                    "source_record": source_record,
                    "transformed_record": transformed,
                })

                key = self.idempotency.generate_migration_key(
                    migration_plan_id=migration_plan_id,
                    record=transformed,
                )

                duplicate_check = self.idempotency.check(key)

                if duplicate_check["is_duplicate"]:
                    duplicates.append({
                        "record_index": index,
                        "key": key,
                        "record": transformed,
                        "reason": "Already processed",
                    })
                    continue

                target_record = {
                    **transformed,
                    "_migration_key": key,
                    "_migration_plan_id": migration_plan_id,
                    "_migration_run_id": migration_run_id,
                }

                self.target_store.append(target_record)

                self.idempotency.register(
                    key=key,
                    record=transformed,
                    migration_run_id=migration_run_id,
                )

                inserted.append({
                    "record_index": index,
                    "key": key,
                    "record": target_record,
                })

            except Exception as exc:
                rejected.append({
                    "record_index": index,
                    "source_record": source_record,
                    "transformed_record": None,
                    "errors": [{
                        "code": "EXECUTION_ERROR",
                        "message": str(exc),
                    }],
                })

        completed_at = datetime.now(timezone.utc).isoformat()

        result = {
            "migration_run_id": migration_run_id,
            "migration_plan_id": migration_plan_id,
            "mode": "execute",
            "started_at": started_at,
            "completed_at": completed_at,
            "source_count": len(source_records),
            "accepted_count": len(accepted),
            "rejected_count": len(rejected),
            "inserted_count": len(inserted),
            "duplicate_count": len(duplicates),
            "target_count": len(self.target_store),
            "accepted": accepted,
            "rejected": rejected,
            "inserted": inserted,
            "duplicates": duplicates,
            "status": (
                "completed"
                if not rejected
                else "completed_with_rejections"
            ),
        }

        self.execution_history.append(result)

        return result

    def get_target_records(self) -> list[dict[str, Any]]:
        return list(self.target_store)

    def get_target_count(self) -> int:
        return len(self.target_store)

    def clear_target(self) -> None:
        self.target_store.clear()

    def get_execution_history(self) -> list[dict[str, Any]]:
        return list(self.execution_history)