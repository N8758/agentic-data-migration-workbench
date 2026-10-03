from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.ai.service import AIService
from app.ai.tools import validate_mapping
from app.repositories.plan_repository import PlanRepository


router = APIRouter(
    prefix="/api/agent",
    tags=["Agent"],
)


@router.post("/generate-plan")
async def generate_plan(
    db: AsyncSession = Depends(get_db),
):
    try:
        service = AIService()

        # AIService internally loads:
        # source schema
        # target schema
        # source records
        # transformation rules
        result = await service.generate_migration_plan()

        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail="AI returned an invalid migration plan.",
            )

        mappings = result.get(
            "mappings",
            result.get("field_mappings", []),
        )

        if not isinstance(mappings, list):
            mappings = []

        validation = validate_mapping(
            mappings=mappings,
        )

        # ---------------------------------------------------------
        # SAVE MIGRATION PLAN
        # ---------------------------------------------------------

        repository = PlanRepository(db)

        saved_plan = await repository.create(
            {
                "name": result.get(
                    "name",
                    "Migration Plan",
                ),
                "description": result.get(
                    "summary",
                    "",
                ),
                "source_name": "source",
                "target_name": "target",
                "current_version": 1,
                "status": "draft",
            }
        )

        plan_id = str(saved_plan.id)

        # ---------------------------------------------------------
        # RETURN PLAN + REAL DATABASE ID
        # ---------------------------------------------------------

        return {
            "success": True,
            "plan_id": plan_id,
            "plan": {
                **result,
                "id": plan_id,
                "version": saved_plan.current_version,
                "status": saved_plan.status,
            },
            "validation": validation,
            "tools_used": [
                "inspect_source_schema",
                "inspect_target_schema",
                "inspect_source_records",
                "get_supported_transformations",
                "validate_mapping",
            ],
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate migration plan: {str(exc)}",
        )