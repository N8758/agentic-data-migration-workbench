from typing import Any


class MigrationReconciler:
    def compare_counts(
        self,
        source_count: int,
        accepted_count: int,
        target_count: int,
        rejected_count: int = 0,
        duplicate_count: int = 0,
    ) -> dict[str, Any]:
        expected_target_count = accepted_count

        difference = (
            expected_target_count - target_count
        )

        source_accounted_for = (
            accepted_count
            + rejected_count
        )

        source_count_matches = (
            source_accounted_for == source_count
        )

        target_count_matches = (
            target_count == expected_target_count
        )

        return {
            "source_count": source_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "duplicate_count": duplicate_count,
            "target_count": target_count,
            "expected_target_count": expected_target_count,
            "target_difference": difference,
            "source_accounted_for": source_accounted_for,
            "source_count_matches": source_count_matches,
            "target_count_matches": target_count_matches,
            "reconciled": (
                source_count_matches
                and target_count_matches
            ),
        }

    def compare_records(
        self,
        accepted_records: list[dict[str, Any]],
        target_records: list[dict[str, Any]],
        idempotency_key: str = "_migration_key",
    ) -> dict[str, Any]:
        accepted_keys = set()
        target_keys = set()

        for record in accepted_records:
            key = record.get(idempotency_key)

            if key is not None:
                accepted_keys.add(key)

        for record in target_records:
            key = record.get(idempotency_key)

            if key is not None:
                target_keys.add(key)

        missing_in_target = sorted(
            accepted_keys - target_keys
        )

        unexpected_in_target = sorted(
            target_keys - accepted_keys
        )

        matched = (
            len(accepted_keys & target_keys)
        )

        return {
            "accepted_key_count": len(accepted_keys),
            "target_key_count": len(target_keys),
            "matched_count": matched,
            "missing_in_target": missing_in_target,
            "unexpected_in_target": unexpected_in_target,
            "record_reconciled": (
                len(missing_in_target) == 0
                and len(unexpected_in_target) == 0
            ),
        }

    def reconcile(
        self,
        source_records: list[dict[str, Any]],
        accepted_records: list[dict[str, Any]],
        rejected_records: list[dict[str, Any]],
        target_records: list[dict[str, Any]],
        duplicate_count: int = 0,
    ) -> dict[str, Any]:
        count_result = self.compare_counts(
            source_count=len(source_records),
            accepted_count=len(accepted_records),
            rejected_count=len(rejected_records),
            target_count=len(target_records),
            duplicate_count=duplicate_count,
        )

        record_result = self.compare_records(
            accepted_records=accepted_records,
            target_records=target_records,
        )

        return {
            "reconciled": (
                count_result["reconciled"]
                and record_result["record_reconciled"]
            ),
            "counts": count_result,
            "records": record_result,
        }