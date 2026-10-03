from datetime import datetime, timezone
from typing import Any


class MigrationRollback:
    def __init__(
        self,
        target_store: list[dict[str, Any]],
        idempotency_manager: Any | None = None,
    ):
        self.target_store = target_store
        self.idempotency_manager = idempotency_manager
        self.rollback_history: list[dict[str, Any]] = []

    def rollback_run(
        self,
        migration_run_id: str,
    ) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc).isoformat()

        removed = []
        remaining = []

        for record in self.target_store:
            if record.get("_migration_run_id") == migration_run_id:
                removed.append(record)
            else:
                remaining.append(record)

        self.target_store[:] = remaining

        removed_keys = []

        for record in removed:
            key = record.get("_migration_key")

            if key:
                removed_keys.append(key)

        if self.idempotency_manager and removed_keys:
            self.idempotency_manager.remove_many(
                removed_keys
            )

        completed_at = datetime.now(timezone.utc).isoformat()

        result = {
            "migration_run_id": migration_run_id,
            "started_at": started_at,
            "completed_at": completed_at,
            "removed_count": len(removed),
            "removed_records": removed,
            "status": "rolled_back",
        }

        self.rollback_history.append(result)

        return result

    def rollback_plan(
        self,
        migration_plan_id: str,
    ) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc).isoformat()

        removed = []
        remaining = []

        for record in self.target_store:
            if record.get("_migration_plan_id") == migration_plan_id:
                removed.append(record)
            else:
                remaining.append(record)

        self.target_store[:] = remaining

        removed_keys = []

        for record in removed:
            key = record.get("_migration_key")

            if key:
                removed_keys.append(key)

        if self.idempotency_manager and removed_keys:
            self.idempotency_manager.remove_many(
                removed_keys
            )

        completed_at = datetime.now(timezone.utc).isoformat()

        result = {
            "migration_plan_id": migration_plan_id,
            "started_at": started_at,
            "completed_at": completed_at,
            "removed_count": len(removed),
            "removed_records": removed,
            "status": "rolled_back",
        }

        self.rollback_history.append(result)

        return result

    def get_history(self) -> list[dict[str, Any]]:
        return list(self.rollback_history)