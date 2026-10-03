from typing import Any

from app.ai.tools import (
    inspect_source_schema,
    inspect_target_schema,
    get_supported_transformations,
    validate_mapping,
)


class MigrationMapper:
    def __init__(self) -> None:
        self.source_schema = inspect_source_schema()
        self.target_schema = inspect_target_schema()
        self.transformation_rules = get_supported_transformations()

        self.source_fields = {
            field["name"]: field
            for field in self.source_schema.get("fields", [])
        }

        self.target_fields = {
            field["name"]: field
            for field in self.target_schema.get("fields", [])
        }

        self.supported_transformations = {
            item["name"]: item
            for item in self.transformation_rules.get(
                "supported_transformations",
                [],
            )
        }

    def validate(self, mappings: list[dict[str, Any]]) -> dict[str, Any]:
        return validate_mapping(mappings)

    def normalize_mapping(
        self,
        mapping: dict[str, Any],
    ) -> dict[str, Any]:
        source_field = mapping.get("source_field")
        target_field = mapping.get("target_field")
        transformation = mapping.get("transformation")

        if not source_field or not target_field:
            raise ValueError(
                "source_field and target_field are required"
            )

        if source_field not in self.source_fields:
            raise ValueError(
                f"Unknown source field: {source_field}"
            )

        if target_field not in self.target_fields:
            raise ValueError(
                f"Unknown target field: {target_field}"
            )

        if transformation:
            if transformation not in self.supported_transformations:
                raise ValueError(
                    f"Unsupported transformation: {transformation}"
                )
        else:
            transformation = self._infer_transformation(
                source_field,
                target_field,
            )

        return {
            "source_field": source_field,
            "target_field": target_field,
            "transformation": transformation,
            "confidence": mapping.get("confidence", 1.0),
            "risk_level": mapping.get("risk_level", "low"),
            "reasoning": mapping.get(
                "reasoning",
                "Mapping validated against provided schemas.",
            ),
        }

    def normalize_mappings(
        self,
        mappings: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        normalized = []

        for mapping in mappings:
            normalized.append(
                self.normalize_mapping(mapping)
            )

        validation = self.validate(normalized)

        if not validation["valid"]:
            raise ValueError(
                f"Invalid migration mapping: {validation['errors']}"
            )

        return normalized

    def _infer_transformation(
        self,
        source_field: str,
        target_field: str,
    ) -> str:
        source = self.source_fields[source_field]
        target = self.target_fields[target_field]

        source_type = source.get("type")
        target_type = target.get("type")

        source_format = source.get("format")
        target_format = target.get("format")

        if (
            source_format == "DD-MM-YYYY"
            and target_format == "YYYY-MM-DD"
        ):
            return "date_ddmmyyyy_to_yyyymmdd"

        if (
            source_format == "DD-MM-YYYY HH:mm:ss"
            and target_format == "YYYY-MM-DDTHH:mm:ss"
        ):
            return "datetime_ddmmyyyy_to_iso"

        if source_field == "status" and target_field == "account_status":
            return "status_mapping"

        if source_field == "email" and target_field == "email_address":
            return "lowercase_email"

        if source_type == target_type:
            if source_field != target_field:
                return "rename_field"

            return "direct_copy"

        raise ValueError(
            f"No supported transformation found for "
            f"{source_field} -> {target_field}"
        )

    def get_required_target_fields(self) -> list[str]:
        return [
            field["name"]
            for field in self.target_schema.get("fields", [])
            if field.get("required")
        ]

    def get_unmapped_target_fields(
        self,
        mappings: list[dict[str, Any]],
    ) -> list[str]:
        mapped_fields = {
            mapping["target_field"]
            for mapping in mappings
        }

        return [
            field
            for field in self.target_fields
            if field not in mapped_fields
        ]

    def build_mapping_summary(
        self,
        mappings: list[dict[str, Any]],
    ) -> dict[str, Any]:
        normalized = self.normalize_mappings(mappings)

        return {
            "source_dataset": self.source_schema.get("dataset"),
            "target_dataset": self.target_schema.get("dataset"),
            "mapping_count": len(normalized),
            "mappings": normalized,
            "required_target_fields": self.get_required_target_fields(),
            "unmapped_target_fields": self.get_unmapped_target_fields(
                normalized
            ),
            "validation": self.validate(normalized),
        }