from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.field_mapping import MigrationPlanVersion
from app.repositories.plan_repository import PlanRepository


router = APIRouter(
    prefix="/plans",
    tags=["Migration Plans"],
)


# ---------------------------------------------------------
# DATA DIRECTORY
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[4]
DATA_DIR = BASE_DIR / "data"


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def load_json_file(filename: str) -> Any:
    """
    Load a JSON file from the backend/data directory.

    Returns an empty dict if the file does not exist.
    This prevents approval from failing only because
    the local demo schema files are unavailable.
    """

    file_path = DATA_DIR / filename

    if not file_path.exists():
        return {}

    try:
        import json

        with file_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except Exception:
        return {}


def serialize_plan(plan: Any) -> dict:
    """
    Convert SQLAlchemy model into JSON-safe dictionary.
    """

    if hasattr(plan, "to_dict"):
        return plan.to_dict()

    data = {}

    for column in plan.__table__.columns:
        value = getattr(plan, column.name)

        if hasattr(value, "isoformat"):
            value = value.isoformat()

        data[column.name] = value

    return data


async def create_audit_log(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict | None = None,
):
    """
    Create an audit log entry.
    """

    audit = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=UUID(entity_id) if entity_id else None,
        details=details or {},
    )

    db.add(audit)

    await db.commit()
    await db.refresh(audit)

    return audit


# ---------------------------------------------------------
# GET ALL PLANS
# ---------------------------------------------------------

@router.get("")
async def get_plans(
    db: AsyncSession = Depends(get_db),
):
    repository = PlanRepository(db)

    plans = await repository.get_all()

    return {
        "success": True,
        "count": len(plans),
        "plans": [
            serialize_plan(plan)
            for plan in plans
        ],
    }


# ---------------------------------------------------------
# CREATE PLAN
# ---------------------------------------------------------

@router.post("")
async def create_plan(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    repository = PlanRepository(db)

    # -----------------------------------------------------
    # Only send MigrationPlan fields to MigrationPlan model
    # -----------------------------------------------------

    allowed_plan_fields = {
        "name",
        "description",
        "source_name",
        "target_name",
        "current_version",
        "status",
    }

    plan_data = {
        key: value
        for key, value in payload.items()
        if key in allowed_plan_fields
    }

    # Default values
    if "current_version" not in plan_data:
        plan_data["current_version"] = 1

    if "status" not in plan_data:
        plan_data["status"] = "draft"

    # -----------------------------------------------------
    # Create MigrationPlan
    # -----------------------------------------------------

    plan = await repository.create(plan_data)

    # -----------------------------------------------------
    # Create Version 1 immediately
    #
    # This is the important fix.
    # -----------------------------------------------------

    version_number = getattr(
        plan,
        "current_version",
        1,
    )

    source_schema = payload.get(
        "source_schema"
    )

    if source_schema is None:
        source_schema = load_json_file(
            "source_schema.json"
        )

    target_schema = payload.get(
        "target_schema"
    )

    if target_schema is None:
        target_schema = load_json_file(
            "target_schema.json"
        )

    mappings = payload.get(
        "mappings",
        [],
    )

    transformations = payload.get(
        "transformations",
        [],
    )

    risks = payload.get(
        "risks",
        [],
    )

    clarification_questions = payload.get(
        "clarification_questions",
        [],
    )

    # Ensure JSON values are valid
    if not isinstance(mappings, list):
        mappings = []

    if not isinstance(transformations, list):
        transformations = []

    if not isinstance(risks, list):
        risks = []

    if not isinstance(clarification_questions, list):
        clarification_questions = []

    # -----------------------------------------------------
    # MigrationPlanVersion
    # -----------------------------------------------------

    plan_version = MigrationPlanVersion(
        plan_id=plan.id,
        version=version_number,
        source_schema=source_schema or {},
        target_schema=target_schema or {},
        mappings=mappings,
        transformations=transformations,
        risks=risks,
        clarification_questions=clarification_questions,
        ai_provider=payload.get(
            "ai_provider"
        ),
        ai_model=payload.get(
            "ai_model"
        ),
        status="draft",
    )

    db.add(plan_version)

    await db.commit()
    await db.refresh(plan)
    await db.refresh(plan_version)

    # -----------------------------------------------------
    # Audit
    # -----------------------------------------------------

    await create_audit_log(
        db=db,
        action="plan_created",
        entity_type="migration_plan",
        entity_id=str(plan.id),
        details={
            "version": version_number,
            "plan_version_id": str(
                plan_version.id
            ),
        },
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "plan": serialize_plan(plan),
        "plan_version": {
            "id": str(plan_version.id),
            "plan_id": str(plan_version.plan_id),
            "version": plan_version.version,
            "status": plan_version.status,
            "mappings": plan_version.mappings,
            "transformations": plan_version.transformations,
            "risks": plan_version.risks,
            "clarification_questions": (
                plan_version.clarification_questions
            ),
        },
    }


# ---------------------------------------------------------
# GET SINGLE PLAN
# ---------------------------------------------------------

@router.get("/{plan_id}")
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
):
    repository = PlanRepository(db)

    plan = await repository.get_by_id(
        plan_id
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    return {
        "success": True,
        "plan": serialize_plan(plan),
    }


# ---------------------------------------------------------
# APPROVE PLAN
# ---------------------------------------------------------

@router.post("/{plan_id}/approve")
async def approve_plan(
    plan_id: str,
    payload: dict | None = None,
    db: AsyncSession = Depends(get_db),
):
    repository = PlanRepository(db)

    # -----------------------------------------------------
    # Get plan
    # -----------------------------------------------------

    plan = await repository.get_by_id(
        plan_id
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    current_status = getattr(
        plan,
        "status",
        None,
    )

    current_version = getattr(
        plan,
        "current_version",
        1,
    )

    # -----------------------------------------------------
    # Check if version already exists
    # -----------------------------------------------------

    result = await db.execute(
        select(MigrationPlanVersion)
        .where(
            MigrationPlanVersion.plan_id == plan.id,
            MigrationPlanVersion.version == current_version,
        )
    )

    plan_version = result.scalar_one_or_none()

    # -----------------------------------------------------
    # If version does NOT exist, create it.
    #
    # This fixes your current Dry Run error.
    # -----------------------------------------------------

    if plan_version is None:

        approval_payload = payload or {}

        source_schema = approval_payload.get(
            "source_schema"
        )

        if source_schema is None:
            source_schema = load_json_file(
                "source_schema.json"
            )

        target_schema = approval_payload.get(
            "target_schema"
        )

        if target_schema is None:
            target_schema = load_json_file(
                "target_schema.json"
            )

        mappings = approval_payload.get(
            "mappings",
            [],
        )

        transformations = approval_payload.get(
            "transformations",
            [],
        )

        risks = approval_payload.get(
            "risks",
            [],
        )

        clarification_questions = (
            approval_payload.get(
                "clarification_questions",
                [],
            )
        )

        if not isinstance(mappings, list):
            mappings = []

        if not isinstance(transformations, list):
            transformations = []

        if not isinstance(risks, list):
            risks = []

        if not isinstance(
            clarification_questions,
            list,
        ):
            clarification_questions = []

        plan_version = MigrationPlanVersion(
            plan_id=plan.id,
            version=current_version,
            source_schema=source_schema or {},
            target_schema=target_schema or {},
            mappings=mappings,
            transformations=transformations,
            risks=risks,
            clarification_questions=(
                clarification_questions
            ),
            ai_provider=approval_payload.get(
                "ai_provider"
            ),
            ai_model=approval_payload.get(
                "ai_model"
            ),
            status="approved",
        )

        db.add(plan_version)

        await db.commit()
        await db.refresh(plan_version)

    else:
        # -------------------------------------------------
        # Version already exists
        # -------------------------------------------------

        plan_version.status = "approved"

        await db.commit()
        await db.refresh(plan_version)

    # -----------------------------------------------------
    # Approve main plan
    # -----------------------------------------------------

    plan = await repository.approve(
        plan_id
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    # -----------------------------------------------------
    # Audit
    # -----------------------------------------------------

    await create_audit_log(
        db=db,
        action="plan_approved",
        entity_type="migration_plan",
        entity_id=plan_id,
        details={
            "previous_status": current_status,
            "new_status": "approved",
            "version": current_version,
            "plan_version_id": str(
                plan_version.id
            ),
            "reason": (
                payload or {}
            ).get("reason"),
        },
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Migration plan approved.",
        "plan": serialize_plan(plan),
        "plan_version": {
            "id": str(plan_version.id),
            "plan_id": str(plan_version.plan_id),
            "version": plan_version.version,
            "status": plan_version.status,
            "mappings": plan_version.mappings,
            "transformations": plan_version.transformations,
            "risks": plan_version.risks,
            "clarification_questions": (
                plan_version.clarification_questions
            ),
        },
    }


# ---------------------------------------------------------
# REJECT PLAN
# ---------------------------------------------------------

@router.post("/{plan_id}/reject")
async def reject_plan(
    plan_id: str,
    payload: dict | None = None,
    db: AsyncSession = Depends(get_db),
):
    repository = PlanRepository(db)

    # -----------------------------------------------------
    # Get plan
    # -----------------------------------------------------

    plan = await repository.get_by_id(
        plan_id
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    current_status = getattr(
        plan,
        "status",
        None,
    )

    # -----------------------------------------------------
    # Reject
    # -----------------------------------------------------

    plan = await repository.reject(
        plan_id
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Migration plan not found.",
        )

    # -----------------------------------------------------
    # Audit
    # -----------------------------------------------------

    await create_audit_log(
        db=db,
        action="plan_rejected",
        entity_type="migration_plan",
        entity_id=plan_id,
        details={
            "previous_status": current_status,
            "new_status": "rejected",
            "reason": (
                payload or {}
            ).get("reason"),
        },
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Migration plan rejected.",
        "plan": serialize_plan(plan),
    }