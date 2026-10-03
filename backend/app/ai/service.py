from typing import Any

from app.ai.base_provider import AIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.groq_provider import GroqProvider
from app.ai.prompts import (
    SYSTEM_PROMPT,
    build_mapping_prompt,
    build_validation_prompt,
)
from app.ai.schemas import MigrationPlanProposal, AIValidationResult
from app.ai.tools import (
    inspect_source_schema,
    inspect_target_schema,
    inspect_source_records,
    get_supported_transformations,
    validate_mapping,
)
from app.core.config import settings


class AIService:
    def __init__(self) -> None:
        self.primary_provider: AIProvider | None = None
        self.fallback_provider: AIProvider | None = None

        provider = settings.AI_PRIMARY_PROVIDER.lower()

        if provider == "groq":
            self.primary_provider = GroqProvider()
            self.fallback_provider = GeminiProvider()
        else:
            self.primary_provider = GeminiProvider()
            self.fallback_provider = GroqProvider()

    async def _generate_structured(
        self,
        prompt: str,
        response_schema: dict[str, Any],
    ) -> tuple[dict[str, Any], str, str]:
        errors = []

        providers = [
            self.primary_provider,
            self.fallback_provider,
        ]

        for provider in providers:
            if provider is None:
                continue

            try:
                result = await provider.generate_structured(
                    prompt=prompt,
                    response_schema=response_schema,
                    system_prompt=SYSTEM_PROMPT,
                    temperature=settings.TEMPERATURE,
                    max_tokens=settings.MAX_TOKENS,
                )

                return (
                    result,
                    provider.get_provider_name(),
                    provider.get_model_name(),
                )

            except Exception as exc:
                errors.append(
                    f"{provider.get_provider_name()}: {str(exc)}"
                )

        raise RuntimeError(
            "All AI providers failed: " + " | ".join(errors)
        )

    async def create_migration_plan(self) -> dict[str, Any]:
        source_schema = inspect_source_schema()
        target_schema = inspect_target_schema()
        source_records = inspect_source_records()
        transformation_rules = get_supported_transformations()

        prompt = build_mapping_prompt(
            source_schema=source_schema,
            target_schema=target_schema,
            source_records=source_records,
            transformation_rules=transformation_rules,
        )

        response_schema = MigrationPlanProposal.model_json_schema()

        result, provider, model = await self._generate_structured(
            prompt=prompt,
            response_schema=response_schema,
        )

        proposal = MigrationPlanProposal.model_validate(result)

        deterministic_validation = validate_mapping(
            [
                mapping.model_dump()
                for mapping in proposal.mappings
            ]
        )

        proposal_data = proposal.model_dump()

        proposal_data["ai_provider"] = provider
        proposal_data["ai_model"] = model
        proposal_data["deterministic_validation"] = (
            deterministic_validation
        )

        return proposal_data

    async def generate_migration_plan(
        self,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Compatibility method used by the API route.

        The current migration-plan generation pipeline reads the
        source schema, target schema, source records, and transformation
        rules directly from the backend data/tools.
        """
        return await self.create_migration_plan()

    async def validate_migration_plan(
        self,
        mapping: dict[str, Any],
    ) -> dict[str, Any]:
        source_schema = inspect_source_schema()
        target_schema = inspect_target_schema()
        transformation_rules = get_supported_transformations()

        deterministic_result = validate_mapping(
            mapping.get("mappings", [])
        )

        prompt = build_validation_prompt(
            source_schema=source_schema,
            target_schema=target_schema,
            transformation_rules=transformation_rules,
            mapping=mapping,
        )

        response_schema = AIValidationResult.model_json_schema()

        result, provider, model = await self._generate_structured(
            prompt=prompt,
            response_schema=response_schema,
        )

        ai_result = AIValidationResult.model_validate(result)

        return {
            "ai_provider": provider,
            "ai_model": model,
            "ai_validation": ai_result.model_dump(),
            "deterministic_validation": deterministic_result,
            "valid": (
                ai_result.valid
                and deterministic_result["valid"]
            ),
        }

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        errors = []

        providers = [
            self.primary_provider,
            self.fallback_provider,
        ]

        for provider in providers:
            if provider is None:
                continue

            try:
                result = await provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt or SYSTEM_PROMPT,
                    temperature=settings.TEMPERATURE,
                    max_tokens=settings.MAX_TOKENS,
                )

                return {
                    "content": result,
                    "provider": provider.get_provider_name(),
                    "model": provider.get_model_name(),
                }

            except Exception as exc:
                errors.append(
                    f"{provider.get_provider_name()}: {str(exc)}"
                )

        raise RuntimeError(
            "All AI providers failed: " + " | ".join(errors)
        )