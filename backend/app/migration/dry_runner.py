from datetime import datetime, timezone
from typing import Any

from app.migration.quarantine import QuarantineManager
from app.migration.transformer import (
    MigrationTransformer,
    TransformationError,
)
from app.migration.validator import RecordValidator


class DryRunner:
    def __init__(
        self,
        target_schema: dict[str, Any],
        validation_rules: list[dict[str, Any]] | None = None,
        supported_transformations: dict[str, Any] | None = None,
    ):
        self.validator = RecordValidator(
            target_schema=target_schema,
            validation_rules=validation_rules or [],
        )

        self.transformer = MigrationTransformer(
            supported_transformations=supported_transformations or {},
        )

        self.quarantine_manager = QuarantineManager()

    def run(
        self,
        source_records: list[dict[str, Any]],
        mappings: list[dict[str, Any]],
        run_id: str | None = None,
    ) -> dict[str, Any]:
        accepted = []
        rejected = []
        transformed_records = []

        started_at = datetime.now(timezone.utc).isoformat()

        for index, source_record in enumerate(source_records):
            try:
                transformed_record = self.transformer.transform_record(
                    record=source_record,
                    mappings=mappings,
                )

                validation = self.validator.validate_record(
                    transformed_record
                )

                if validation["valid"]:
                    accepted_item = {
                        "record_index": index,
                        "source_record": source_record,
                        "transformed_record": transformed_record,
                        "warnings": validation["warnings"],
                    }

                    accepted.append(accepted_item)
                    transformed_records.append(
                        transformed_record
                    )

                else:
                    rejected_item = {
                        "record_index": index,
                        "source_record": source_record,
                        "transformed_record": transformed_record,
                        "errors": validation["errors"],
                        "warnings": validation["warnings"],
                    }

                    rejected.append(rejected_item)

                    self.quarantine_manager.quarantine_record(
                        record=transformed_record,
                        errors=validation["errors"],
                        record_index=index,
                        run_id=run_id,
                    )

            except TransformationError as exc:
                error = {
                    "code": "TRANSFORMATION_ERROR",
                    "message": str(exc),
                }

                rejected_item = {
                    "record_index": index,
                    "source_record": source_record,
                    "transformed_record": None,
                    "errors": [error],
                    "warnings": [],
                }

                rejected.append(rejected_item)

                self.quarantine_manager.quarantine_record(
                    record=source_record,
                    errors=[error],
                    record_index=index,
                    run_id=run_id,
                )

            except Exception as exc:
                error = {
                    "code": "PROCESSING_ERROR",
                    "message": str(exc),
                }

                rejected_item = {
                    "record_index": index,
                    "source_record": source_record,
                    "transformed_record": None,
                    "errors": [error],
                    "warnings": [],
                }

                rejected.append(rejected_item)

                self.quarantine_manager.quarantine_record(
                    record=source_record,
                    errors=[error],
                    record_index=index,
                    run_id=run_id,
                )

        completed_at = datetime.now(timezone.utc).isoformat()

        return {
            "run_id": run_id,
            "mode": "dry_run",
            "started_at": started_at,
            "completed_at": completed_at,
            "source_count": len(source_records),
            "transformed_count": len(transformed_records),
            "accepted_count": len(accepted),
            "rejected_count": len(rejected),
            "quarantined_count": len(
                self.quarantine_manager.get_all(run_id)
            ),
            "accepted": accepted,
            "rejected": rejected,
            "transformed_records": transformed_records,
            "will_insert_count": len(transformed_records),
            "target_inserted_count": 0,
            "target_changed": False,
        }

    def preview(
        self,
        source_records: list[dict[str, Any]],
        mappings: list[dict[str, Any]],
        limit: int = 10,
    ) -> dict[str, Any]:
        limited_records = source_records[:limit]

        result = self.run(
            source_records=limited_records,
            mappings=mappings,
        )

        return {
            "mode": "preview",
            "requested_limit": limit,
            "records": result["transformed_records"],
            "accepted_count": result["accepted_count"],
            "rejected_count": result["rejected_count"],
        }