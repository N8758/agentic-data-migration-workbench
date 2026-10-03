import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.plan_repository import PlanRepository
from app.repositories.migration_repository import MigrationRepository
from app.repositories.audit_repository import AuditRepository
from app.migration.dry_runner import DryRunner
from app.models.field_mapping import MigrationPlanVersion


router = APIRouter(
    prefix="/api/dry-run",
    tags=["Dry Run"],
)


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str) -> Any:
    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Data file not found: {filename}",
        )

    try:
        with file_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in {filename}: {exc}",
        )


def serialize_object(obj: Any) -> dict:
    if hasattr(obj, "to_dict"):
        return obj.to_dict()

    if hasattr(obj, "__table__"):
        result = {}

        for column in obj.__table__.columns:
            value = getattr(obj, column.name)

            if hasattr(value, "isoformat"):
                value = value.isoformat()

            result[column.name] = value

        return result

    if isinstance(obj, dict):
        return obj

    return {"value": obj}


@router.post("")
async def execute_dry_run(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    plan_id = payload.get("plan_id")

    if not plan_id:
        raise HTTPException(
            status_code=400,
            detail="plan_id is required.",
        )

    # ---------------------------------------------------------
    # Get migration plan
    # ---------------------------------------------------------

    plan_repository = PlanRepository(db)

    plan = await plan_repository.get_by_id(plan_id)

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    status = getattr(
        plan,
        "status",
        None,
    )

    if status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Migration plan must be approved before dry run.",
        )

    # ---------------------------------------------------------
    # Load migration data
    # ---------------------------------------------------------

    source_schema = load_json(
        "source_schema.json"
    )

    target_schema = load_json(
        "target_schema.json"
    )

    # ---------------------------------------------------------
    # Load and normalize source records
    # ---------------------------------------------------------

    source_records_data = load_json(
        "source_records.json"
    )

    if isinstance(source_records_data, dict):
        if isinstance(
            source_records_data.get("records"),
            list,
        ):
            source_records = source_records_data["records"]

        elif isinstance(
            source_records_data.get("dataset"),
            list,
        ):
            source_records = source_records_data["dataset"]

        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "source_records.json must contain "
                    "a 'records' or 'dataset' list."
                ),
            )

    elif isinstance(source_records_data, list):
        source_records = source_records_data

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid source_records.json format.",
        )

    transformation_rules = load_json(
        "transformation_rules.json"
    )

    # ---------------------------------------------------------
    # Get mappings
    # ---------------------------------------------------------

    mappings = (
        payload.get("mappings")
        or getattr(
            plan,
            "mappings",
            None,
        )
        or getattr(
            plan,
            "field_mappings",
            None,
        )
        or []
    )

    if isinstance(mappings, str):
        try:
            mappings = json.loads(mappings)
        except json.JSONDecodeError:
            mappings = []

    if not isinstance(mappings, list):
        raise HTTPException(
            status_code=400,
            detail="Migration mappings must be a list.",
        )

    # ---------------------------------------------------------
    # Transformation configuration
    # ---------------------------------------------------------

    validation_rules = transformation_rules.get(
        "validation_rules",
        [],
    )

    supported_transformations = (
        transformation_rules.get(
            "transformations",
            transformation_rules,
        )
    )

    # ---------------------------------------------------------
    # Dry runner
    # ---------------------------------------------------------

    runner = DryRunner(
        target_schema=target_schema,
        validation_rules=validation_rules,
        supported_transformations=supported_transformations,
    )

    run_id = payload.get("run_id")

    result = runner.run(
        source_records=source_records,
        mappings=mappings,
        run_id=run_id,
    )

    # ---------------------------------------------------------
    # Migration repository
    # ---------------------------------------------------------

    migration_repository = MigrationRepository(db)

    # ---------------------------------------------------------
    # Get current plan version
    # ---------------------------------------------------------

    current_version = getattr(
        plan,
        "current_version",
        1,
    )

    # IMPORTANT:
    # database.py uses AsyncSession.
    # Therefore we MUST use select() + await db.execute()
    # instead of db.query().
    # ---------------------------------------------------------

    version_result = await db.execute(
        select(MigrationPlanVersion).where(
            MigrationPlanVersion.plan_id == plan.id,
            MigrationPlanVersion.version == current_version,
        )
    )

    plan_version = version_result.scalar_one_or_none()

    if plan_version is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Migration plan version not found "
                f"for version {current_version}."
            ),
        )

    # ---------------------------------------------------------
    # Create/update migration run
    # ---------------------------------------------------------

    run_data = {
        "plan_id": plan.id,
        "plan_version_id": plan_version.id,
        "status": "completed",
        "source_count": result[
            "source_count"
        ],
        "accepted_count": result[
            "accepted_count"
        ],
        "rejected_count": result[
            "rejected_count"
        ],
    }

    if run_id:
        migration_run = await migration_repository.update_run(
            run_id,
            run_data,
        )

        if migration_run is None:
            raise HTTPException(
                status_code=404,
                detail="Migration run not found.",
            )

    else:
        migration_run = await migration_repository.create_run(
            run_data
        )

    # ---------------------------------------------------------
    # Audit log
    # ---------------------------------------------------------

    audit_repository = AuditRepository(db)

    await audit_repository.log_dry_run(
        run_id=str(migration_run.id),
        details={
            "plan_id": str(plan_id),
            "plan_version_id": str(
                plan_version.id
            ),
            "version": current_version,
            "source_count": result[
                "source_count"
            ],
            "accepted_count": result[
                "accepted_count"
            ],
            "rejected_count": result[
                "rejected_count"
            ],
        },
    )

    # ---------------------------------------------------------
    # Response
    # ---------------------------------------------------------

    return {
        "success": True,
        "plan_id": str(plan_id),
        "plan_version_id": str(
            plan_version.id
        ),
        "run": serialize_object(
            migration_run
        ),
        "dry_run": result,
    }


@router.get("/{run_id}")
async def get_dry_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
):
    repository = MigrationRepository(db)

    run = await repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    records = await repository.get_records(
        run_id
    )

    quarantine = await repository.get_quarantine(
        run_id
    )

    counts = await repository.get_run_counts(
        run_id
    )

    return {
        "success": True,
        "run": serialize_object(run),
        "records": [
            serialize_object(record)
            for record in records
        ],
        "quarantine": [
            serialize_object(record)
            for record in quarantine
        ],
        "counts": counts,
    }