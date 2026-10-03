from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.migration_repository import MigrationRepository
from app.migration.reconciliation import MigrationReconciler


router = APIRouter(
    prefix="/api/reconciliation",
    tags=["Reconciliation"],
)


def serialize_object(obj):
    if hasattr(obj, "to_dict"):
        return obj.to_dict()

    if hasattr(obj, "__table__"):
        data = {}

        for column in obj.__table__.columns:
            value = getattr(obj, column.name)

            if hasattr(value, "isoformat"):
                value = value.isoformat()

            data[column.name] = value

        return data

    return obj


@router.get("/{run_id}")
def get_reconciliation(
    run_id: str,
    db: Session = Depends(get_db),
):
    migration_repository = MigrationRepository(db)

    run = migration_repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    records = migration_repository.get_records(
        run_id
    )

    quarantine = migration_repository.get_quarantine(
        run_id
    )

    source_count = getattr(
        run,
        "source_count",
        len(records),
    )

    accepted_count = getattr(
        run,
        "accepted_count",
        0,
    )

    rejected_count = getattr(
        run,
        "rejected_count",
        0,
    )

    target_count = getattr(
        run,
        "target_count",
        0,
    )

    if accepted_count == 0:
        accepted_count = sum(
            1
            for record in records
            if getattr(
                record,
                "status",
                None,
            )
            == "accepted"
        )

    if rejected_count == 0:
        rejected_count = sum(
            1
            for record in records
            if getattr(
                record,
                "status",
                None,
            )
            == "rejected"
        )

    if target_count == 0:
        target_count = accepted_count

    source_vs_processed = (
        source_count
        == accepted_count + rejected_count
    )

    accepted_vs_target = (
        accepted_count
        == target_count
    )

    overall_match = (
        source_vs_processed
        and accepted_vs_target
    )

    return {
        "success": True,
        "run_id": run_id,
        "reconciliation": {
            "source_count": source_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "quarantined_count": len(
                quarantine
            ),
            "target_count": target_count,
            "source_vs_processed": {
                "expected": source_count,
                "actual": (
                    accepted_count
                    + rejected_count
                ),
                "match": source_vs_processed,
            },
            "accepted_vs_target": {
                "expected": accepted_count,
                "actual": target_count,
                "match": accepted_vs_target,
            },
            "overall_match": overall_match,
        },
        "run": serialize_object(run),
    }