from datetime import datetime, timezone
from typing import Any


class QuarantineManager:
    def __init__(self):
        self.records: list[dict[str, Any]] = []

    def quarantine_record(
        self,
        record: dict[str, Any],
        errors: list[dict[str, Any]],
        record_index: int | None = None,
        run_id: str | None = None,
    ) -> dict[str, Any]:
        item = {
            "id": self._generate_id(),
            "run_id": run_id,
            "record_index": record_index,
            "record": record,
            "errors": errors,
            "error_count": len(errors),
            "status": "quarantined",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        self.records.append(item)

        return item

    def quarantine_records(
        self,
        rejected_records: list[dict[str, Any]],
        run_id: str | None = None,
    ) -> list[dict[str, Any]]:
        quarantined = []

        for item in rejected_records:
            quarantined.append(
                self.quarantine_record(
                    record=item.get("record", {}),
                    errors=item.get("errors", []),
                    record_index=item.get("record_index"),
                    run_id=run_id,
                )
            )

        return quarantined

    def get_all(
        self,
        run_id: str | None = None,
    ) -> list[dict[str, Any]]:
        if run_id is None:
            return list(self.records)

        return [
            record
            for record in self.records
            if record.get("run_id") == run_id
        ]

    def get_by_id(
        self,
        quarantine_id: str,
    ) -> dict[str, Any] | None:
        for record in self.records:
            if record["id"] == quarantine_id:
                return record

        return None

    def release(
        self,
        quarantine_id: str,
    ) -> dict[str, Any]:
        record = self.get_by_id(quarantine_id)

        if record is None:
            raise ValueError(
                f"Quarantine record not found: {quarantine_id}"
            )

        record["status"] = "released"
        record["released_at"] = datetime.now(
            timezone.utc
        ).isoformat()

        return record

    def delete(
        self,
        quarantine_id: str,
    ) -> bool:
        original_length = len(self.records)

        self.records = [
            record
            for record in self.records
            if record["id"] != quarantine_id
        ]

        return len(self.records) < original_length

    def count(
        self,
        run_id: str | None = None,
    ) -> int:
        return len(self.get_all(run_id))

    def _generate_id(self) -> str:
        return f"quarantine-{len(self.records) + 1:06d}"