from typing import Any

from app.ai.service import AIService
from app.ai.tools import (
    inspect_source_schema,
    inspect_target_schema,
    inspect_source_records,
    get_supported_transformations,
    validate_mapping,
)
from app.migration.mapper import MigrationMapper


class MigrationPlanner:
    def __init__(self):
        self.ai_service = AIService()
        self.mapper = MigrationMapper()

    async def generate_plan(self) -> dict[str, Any]:
        source_schema = inspect_source_schema()
        target_schema = inspect_target_schema()
        source_records = inspect_source_records()
        transformation_rules = get_supported_transformations()

        ai_plan = await self.ai_service.create_migration_plan()

        mappings = ai_plan.get("mappings", [])

        normalized_mappings = self.mapper.normalize_mappings(
            mappings
        )

        deterministic_validation = validate_mapping(
            normalized_mappings
        )

        return {
            "source": {
                "dataset": source_schema.get("dataset"),
                "field_count": len(
                    source_schema.get("fields", [])
                ),
                "record_count": source_records.get(
                    "total_available_records",
                    0,
                ),
            },
            "target": {
                "dataset": target_schema.get("dataset"),
                "field_count": len(
                    target_schema.get("fields", [])
                ),
            },
            "transformations": transformation_rules,
            "mappings": normalized_mappings,
            "risks": ai_plan.get("risks", []),
            "clarification_questions": ai_plan.get(
                "clarification_questions",
                [],
            ),
            "assumptions": ai_plan.get(
                "assumptions",
                [],
            ),
            "summary": ai_plan.get(
                "summary",
                "",
            ),
            "overall_confidence": ai_plan.get(
                "overall_confidence",
                0,
            ),
            "ai_provider": ai_plan.get(
                "ai_provider",
            ),
            "ai_model": ai_plan.get(
                "ai_model",
            ),
            "validation": deterministic_validation,
            "status": (
                "ready_for_approval"
                if deterministic_validation["valid"]
                else "requires_review"
            ),
        }

    async def validate_plan(
        self,
        plan: dict[str, Any],
    ) -> dict[str, Any]:
        mappings = plan.get("mappings", [])

        normalized_mappings = self.mapper.normalize_mappings(
            mappings
        )

        deterministic_validation = validate_mapping(
            normalized_mappings
        )

        ai_validation = await self.ai_service.validate_migration_plan(
            {
                "mappings": normalized_mappings,
                "risks": plan.get("risks", []),
                "assumptions": plan.get(
                    "assumptions",
                    [],
                ),
            }
        )

        return {
            "valid": (
                deterministic_validation["valid"]
                and ai_validation["valid"]
            ),
            "deterministic_validation": deterministic_validation,
            "ai_validation": ai_validation,
            "mappings": normalized_mappings,
        }

    def normalize_plan(
        self,
        plan: dict[str, Any],
    ) -> dict[str, Any]:
        mappings = self.mapper.normalize_mappings(
            plan.get("mappings", [])
        )

        validation = validate_mapping(mappings)

        return {
            **plan,
            "mappings": mappings,
            "validation": validation,
            "status": (
                "ready_for_approval"
                if validation["valid"]
                else "requires_review"
            ),
        }