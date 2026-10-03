import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"

SOURCE_SCHEMA_PATH = DATA_DIR / "source_schema.json"
TARGET_SCHEMA_PATH = DATA_DIR / "target_schema.json"
SOURCE_RECORDS_PATH = DATA_DIR / "source_records.json"
TRANSFORMATION_RULES_PATH = DATA_DIR / "transformation_rules.json"


def _load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Required data file not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def inspect_source_schema() -> dict[str, Any]:
    data = _load_json(SOURCE_SCHEMA_PATH)

    return {
        "dataset": data.get("dataset"),
        "description": data.get("description"),
        "maximum_sample_size": data.get("maximum_sample_size"),
        "fields": data.get("fields", [])
    }


def inspect_target_schema() -> dict[str, Any]:
    data = _load_json(TARGET_SCHEMA_PATH)

    return {
        "dataset": data.get("dataset"),
        "description": data.get("description"),
        "maximum_sample_size": data.get("maximum_sample_size"),
        "fields": data.get("fields", [])
    }


def inspect_source_records() -> dict[str, Any]:
    data = _load_json(SOURCE_RECORDS_PATH)
    source_schema = _load_json(SOURCE_SCHEMA_PATH)

    maximum_sample_size = source_schema.get(
        "maximum_sample_size",
        20
    )

    records = data.get("records", [])

    return {
        "dataset": data.get("dataset"),
        "total_available_records": len(records),
        "maximum_sample_size": maximum_sample_size,
        "records": records[:maximum_sample_size]
    }


def get_supported_transformations() -> dict[str, Any]:
    data = _load_json(TRANSFORMATION_RULES_PATH)

    return {
        "dataset": data.get("dataset"),
        "supported_transformations": data.get(
            "supported_transformations",
            []
        ),
        "field_mappings": data.get(
            "field_mappings",
            []
        ),
        "validation_rules": data.get(
            "validation_rules",
            []
        ),
        "limits": data.get(
            "limits",
            {}
        )
    }


def validate_mapping(
    mappings: list[dict[str, Any]]
) -> dict[str, Any]:
    source_schema = inspect_source_schema()
    target_schema = inspect_target_schema()
    transformation_data = get_supported_transformations()

    source_fields = {
        field["name"]: field
        for field in source_schema.get("fields", [])
    }

    target_fields = {
        field["name"]: field
        for field in target_schema.get("fields", [])
    }

    supported_transformations = {
        item["name"]
        for item in transformation_data.get(
            "supported_transformations",
            []
        )
        if "name" in item
    }

    errors = []
    warnings = []
    validated_mappings = []

    mapped_source_fields = set()
    mapped_target_fields = set()

    for index, mapping in enumerate(mappings):
        source_field = mapping.get("source_field")
        target_field = mapping.get("target_field")
        transformation = mapping.get("transformation")

        if not source_field:
            errors.append({
                "index": index,
                "code": "MISSING_SOURCE_FIELD",
                "message": "Source field is required"
            })
            continue

        if not target_field:
            errors.append({
                "index": index,
                "code": "MISSING_TARGET_FIELD",
                "message": "Target field is required"
            })
            continue

        if source_field not in source_fields:
            errors.append({
                "index": index,
                "code": "UNKNOWN_SOURCE_FIELD",
                "field": source_field,
                "message": f"Source field '{source_field}' does not exist"
            })
            continue

        if target_field not in target_fields:
            errors.append({
                "index": index,
                "code": "UNKNOWN_TARGET_FIELD",
                "field": target_field,
                "message": f"Target field '{target_field}' does not exist"
            })
            continue

        if source_field in mapped_source_fields:
            errors.append({
                "index": index,
                "code": "DUPLICATE_SOURCE_MAPPING",
                "field": source_field,
                "message": f"Source field '{source_field}' is mapped more than once"
            })

        if target_field in mapped_target_fields:
            errors.append({
                "index": index,
                "code": "DUPLICATE_TARGET_MAPPING",
                "field": target_field,
                "message": f"Target field '{target_field}' is mapped more than once"
            })

        if transformation and transformation not in supported_transformations:
            errors.append({
                "index": index,
                "code": "UNSUPPORTED_TRANSFORMATION",
                "transformation": transformation,
                "message": (
                    f"Transformation '{transformation}' "
                    "is not supported"
                )
            })

        source_type = source_fields[source_field].get("type")
        target_type = target_fields[target_field].get("type")

        if source_type != target_type and not transformation:
            errors.append({
                "index": index,
                "code": "TYPE_MISMATCH",
                "source_field": source_field,
                "target_field": target_field,
                "source_type": source_type,
                "target_type": target_type,
                "message": (
                    f"Source type '{source_type}' and target type "
                    f"'{target_type}' require a supported transformation"
                )
            })

        if (
            source_type == target_type
            and transformation is None
        ):
            transformation = "direct_copy"

        if transformation:
            warnings.append({
                "source_field": source_field,
                "target_field": target_field,
                "transformation": transformation
            })

        mapped_source_fields.add(source_field)
        mapped_target_fields.add(target_field)

        validated_mappings.append({
            "source_field": source_field,
            "target_field": target_field,
            "transformation": transformation
        })

    for field_name, field in target_fields.items():
        if field.get("required") and field_name not in mapped_target_fields:
            errors.append({
                "code": "REQUIRED_TARGET_FIELD_UNMAPPED",
                "field": field_name,
                "message": (
                    f"Required target field '{field_name}' "
                    "does not have a mapping"
                )
            })

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "mappings": validated_mappings,
        "source_fields": list(source_fields.keys()),
        "target_fields": list(target_fields.keys())
    }