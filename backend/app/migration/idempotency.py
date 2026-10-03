import hashlib
import json
from typing import Any


class IdempotencyManager:
    def __init__(self):
        self.processed_keys: dict[str, dict[str, Any]] = {}

    def generate_record_key(
        self,
        record: dict[str, Any],
    ) -> str:
        normalized = json.dumps(
            record,
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        )

        return hashlib.sha256(
            normalized.encode("utf-8")
        ).hexdigest()

    def generate_migration_key(
        self,
        migration_plan_id: str,
        record: dict[str, Any],
    ) -> str:
        record_key = self.generate_record_key(record)

        value = f"{migration_plan_id}:{record_key}"

        return hashlib.sha256(
            value.encode("utf-8")
        ).hexdigest()

    def exists(
        self,
        key: str,
    ) -> bool:
        return key in self.processed_keys

    def check(
        self,
        key: str,
    ) -> dict[str, Any]:
        if key in self.processed_keys:
            return {
                "is_duplicate": True,
                "key": key,
                "existing": self.processed_keys[key],
            }

        return {
            "is_duplicate": False,
            "key": key,
            "existing": None,
        }

    def register(
        self,
        key: str,
        record: dict[str, Any],
        migration_run_id: str | None = None,
    ) -> dict[str, Any]:
        if self.exists(key):
            return {
                "registered": False,
                "duplicate": True,
                "key": key,
                "existing": self.processed_keys[key],
            }

        entry = {
            "key": key,
            "record": record,
            "migration_run_id": migration_run_id,
        }

        self.processed_keys[key] = entry

        return {
            "registered": True,
            "duplicate": False,
            "key": key,
            "entry": entry,
        }

    def register_many(
        self,
        records: list[dict[str, Any]],
        migration_plan_id: str,
        migration_run_id: str | None = None,
    ) -> dict[str, Any]:
        inserted = []
        duplicates = []

        for record in records:
            key = self.generate_migration_key(
                migration_plan_id=migration_plan_id,
                record=record,
            )

            result = self.register(
                key=key,
                record=record,
                migration_run_id=migration_run_id,
            )

            if result["duplicate"]:
                duplicates.append({
                    "key": key,
                    "record": record,
                })
            else:
                inserted.append({
                    "key": key,
                    "record": record,
                })

        return {
            "total": len(records),
            "inserted_count": len(inserted),
            "duplicate_count": len(duplicates),
            "inserted": inserted,
            "duplicates": duplicates,
        }

    def remove(
        self,
        key: str,
    ) -> bool:
        if key not in self.processed_keys:
            return False

        del self.processed_keys[key]

        return True

    def remove_many(
        self,
        keys: list[str],
    ) -> int:
        removed = 0

        for key in keys:
            if self.remove(key):
                removed += 1

        return removed

    def get(
        self,
        key: str,
    ) -> dict[str, Any] | None:
        return self.processed_keys.get(key)

    def clear(self) -> None:
        self.processed_keys.clear()

    def count(self) -> int:
        return len(self.processed_keys)