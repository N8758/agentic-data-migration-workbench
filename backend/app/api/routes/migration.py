from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.plan_repository import PlanRepository
from app.repositories.migration_repository import MigrationRepository
from app.repositories.audit_repository import AuditRepository
from app.migration.executor import MigrationExecutor
from app.migration.rollback import MigrationRollback


router = APIRouter(
    prefix="/api/migration",
    tags=["Migration"],
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


@router.post("/execute")
def execute_migration(
    payload: dict,
    db: Session = Depends(get_db),
):
    plan_id = payload.get("plan_id")
    run_id = payload.get("run_id")

    if not plan_id:
        raise HTTPException(
            status_code=400,
            detail="plan_id is required.",
        )

    if not run_id:
        raise HTTPException(
            status_code=400,
            detail="run_id is required.",
        )

    plan_repository = PlanRepository(db)
    migration_repository = MigrationRepository(db)
    audit_repository = AuditRepository(db)

    plan = plan_repository.get_by_id(plan_id)

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    if getattr(plan, "status", None) != "approved":
        raise HTTPException(
            status_code=400,
            detail="Migration plan must be approved before execution.",
        )

    run = migration_repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    executor = MigrationExecutor()

    records = migration_repository.get_records(run_id)

    if not records:
        raise HTTPException(
            status_code=400,
            detail="No migration records found for this run.",
        )

    record_data = [
        serialize_object(record)
        for record in records
    ]

    result = executor.execute(
        records=record_data,
        run_id=run_id,
    )

    migration_repository.update_run(
        run_id,
        {
            "status": "completed",
            "target_count": result.get(
                "target_count",
                result.get(
                    "accepted_count",
                    0,
                ),
            ),
        },
    )

    plan_repository.mark_executed(plan_id)

    audit_repository.log_execution(
        run_id=run_id,
        details={
            "plan_id": plan_id,
            "result": result,
        },
    )

    updated_run = migration_repository.get_run(
        run_id
    )

    return {
        "success": True,
        "message": "Migration executed successfully.",
        "run": serialize_object(updated_run),
        "result": result,
    }


@router.post("/{run_id}/retry")
def retry_migration(
    run_id: str,
    db: Session = Depends(get_db),
):
    migration_repository = MigrationRepository(db)
    audit_repository = AuditRepository(db)

    run = migration_repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    records = migration_repository.get_records(
        run_id
    )

    if not records:
        raise HTTPException(
            status_code=400,
            detail="No migration records found for retry.",
        )

    executor = MigrationExecutor()

    record_data = [
        serialize_object(record)
        for record in records
    ]

    result = executor.execute(
        records=record_data,
        run_id=run_id,
        retry=True,
    )

    migration_repository.update_run(
        run_id,
        {
            "status": "completed",
            "target_count": result.get(
                "target_count",
                result.get(
                    "accepted_count",
                    0,
                ),
            ),
        },
    )

    audit_repository.log_retry(
        run_id=run_id,
        details={
            "result": result,
        },
    )

    updated_run = migration_repository.get_run(
        run_id
    )

    return {
        "success": True,
        "message": "Migration retry completed.",
        "run": serialize_object(updated_run),
        "result": result,
    }


@router.post("/{run_id}/rollback")
def rollback_migration(
    run_id: str,
    db: Session = Depends(get_db),
):
    migration_repository = MigrationRepository(db)
    audit_repository = AuditRepository(db)

    run = migration_repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    rollback_service = MigrationRollback()

    result = rollback_service.rollback(
        run_id=run_id,
    )

    migration_repository.mark_run_rolled_back(
        run_id
    )

    audit_repository.log_rollback(
        run_id=run_id,
        details={
            "result": result,
        },
    )

    updated_run = migration_repository.get_run(
        run_id
    )

    return {
        "success": True,
        "message": "Migration rollback completed.",
        "run": serialize_object(updated_run),
        "result": result,
    }