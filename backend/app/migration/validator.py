import re
from datetime import date, datetime
from typing import Any


class RecordValidator:
    def __init__(
        self,
        target_schema: dict[str, Any],
        validation_rules: list[dict[str, Any]] | None = None,
    ):
        self.target_schema = target_schema
        self.validation_rules = validation_rules or []

        self.fields = {
            field["name"]: field
            for field in target_schema.get("fields", [])
            if "name" in field
        }

    def validate_record(
        self,
        record: dict[str, Any],
    ) -> dict[str, Any]:
        errors = []
        warnings = []

        for field_name, field in self.fields.items():
            value = record.get(field_name)

            if field.get("required") and self._is_empty(value):
                errors.append({
                    "field": field_name,
                    "code": "REQUIRED_FIELD_MISSING",
                    "message": f"Required field '{field_name}' is missing",
                })
                continue

            if self._is_empty(value):
                continue

            field_errors, field_warnings = self._validate_field(
                field_name,
                field,
                value,
            )

            errors.extend(field_errors)
            warnings.extend(field_warnings)

        rule_errors, rule_warnings = self._validate_rules(record)

        errors.extend(rule_errors)
        warnings.extend(rule_warnings)

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "record": record,
        }

    def validate_records(
        self,
        records: list[dict[str, Any]],
    ) -> dict[str, Any]:
        accepted = []
        rejected = []

        for index, record in enumerate(records):
            result = self.validate_record(record)

            item = {
                "record_index": index,
                "record": record,
                "errors": result["errors"],
                "warnings": result["warnings"],
            }

            if result["valid"]:
                accepted.append(item)
            else:
                rejected.append(item)

        return {
            "total": len(records),
            "accepted_count": len(accepted),
            "rejected_count": len(rejected),
            "accepted": accepted,
            "rejected": rejected,
            "valid": len(rejected) == 0,
        }

    def _validate_field(
        self,
        field_name: str,
        field: dict[str, Any],
        value: Any,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        errors = []
        warnings = []

        expected_type = field.get("type")

        if expected_type and not self._matches_type(
            value,
            expected_type,
        ):
            errors.append({
                "field": field_name,
                "code": "INVALID_TYPE",
                "expected": expected_type,
                "actual": type(value).__name__,
                "message": (
                    f"Field '{field_name}' has invalid type"
                ),
            })
            return errors, warnings

        if field.get("format"):
            if not self._matches_format(
                value,
                field.get("format"),
            ):
                errors.append({
                    "field": field_name,
                    "code": "INVALID_FORMAT",
                    "format": field.get("format"),
                    "message": (
                        f"Field '{field_name}' has invalid format"
                    ),
                })

        if field.get("pattern"):
            try:
                if not re.fullmatch(
                    field["pattern"],
                    str(value),
                ):
                    errors.append({
                        "field": field_name,
                        "code": "PATTERN_MISMATCH",
                        "message": (
                            f"Field '{field_name}' does not "
                            "match required pattern"
                        ),
                    })
            except re.error:
                warnings.append({
                    "field": field_name,
                    "code": "INVALID_SCHEMA_PATTERN",
                    "message": (
                        f"Pattern for '{field_name}' is invalid"
                    ),
                })

        if field.get("min") is not None:
            try:
                if float(value) < float(field["min"]):
                    errors.append({
                        "field": field_name,
                        "code": "BELOW_MINIMUM",
                        "message": (
                            f"Field '{field_name}' is below minimum"
                        ),
                    })
            except (TypeError, ValueError):
                pass

        if field.get("max") is not None:
            try:
                if float(value) > float(field["max"]):
                    errors.append({
                        "field": field_name,
                        "code": "ABOVE_MAXIMUM",
                        "message": (
                            f"Field '{field_name}' exceeds maximum"
                        ),
                    })
            except (TypeError, ValueError):
                pass

        if field.get("min_length") is not None:
            if len(str(value)) < int(field["min_length"]):
                errors.append({
                    "field": field_name,
                    "code": "BELOW_MIN_LENGTH",
                    "message": (
                        f"Field '{field_name}' is shorter than allowed"
                    ),
                })

        if field.get("max_length") is not None:
            if len(str(value)) > int(field["max_length"]):
                errors.append({
                    "field": field_name,
                    "code": "ABOVE_MAX_LENGTH",
                    "message": (
                        f"Field '{field_name}' is longer than allowed"
                    ),
                })

        allowed_values = field.get("allowed_values")

        if allowed_values:
            if value not in allowed_values:
                errors.append({
                    "field": field_name,
                    "code": "INVALID_VALUE",
                    "allowed_values": allowed_values,
                    "message": (
                        f"Field '{field_name}' contains "
                        "an unsupported value"
                    ),
                })

        return errors, warnings

    def _validate_rules(
        self,
        record: dict[str, Any],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        errors = []
        warnings = []

        for rule in self.validation_rules:
            rule_type = rule.get("type")

            if rule_type == "required":
                field = rule.get("field")

                if field and self._is_empty(record.get(field)):
                    errors.append({
                        "field": field,
                        "code": "RULE_REQUIRED",
                        "message": rule.get(
                            "message",
                            f"Field '{field}' is required",
                        ),
                    })

            elif rule_type == "allowed_values":
                field = rule.get("field")
                allowed_values = rule.get("values", [])

                if (
                    field
                    and not self._is_empty(record.get(field))
                    and record.get(field) not in allowed_values
                ):
                    errors.append({
                        "field": field,
                        "code": "RULE_ALLOWED_VALUES",
                        "message": rule.get(
                            "message",
                            f"Invalid value for '{field}'",
                        ),
                    })

            elif rule_type == "unique":
                continue

            elif rule_type == "warning":
                field = rule.get("field")

                if field and record.get(field) is not None:
                    warnings.append({
                        "field": field,
                        "code": "RULE_WARNING",
                        "message": rule.get(
                            "message",
                            f"Review field '{field}'",
                        ),
                    })

        return errors, warnings

    def _matches_type(
        self,
        value: Any,
        expected_type: str,
    ) -> bool:
        normalized = expected_type.lower()

        if normalized in {"string", "str", "text"}:
            return isinstance(value, str)

        if normalized in {"integer", "int"}:
            return isinstance(value, int) and not isinstance(value, bool)

        if normalized in {"float", "double", "number"}:
            return (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
            )

        if normalized in {"boolean", "bool"}:
            return isinstance(value, bool)

        if normalized in {"date", "datetime"}:
            return isinstance(
                value,
                (date, datetime, str),
            )

        if normalized in {"object", "dict", "json"}:
            return isinstance(value, dict)

        if normalized in {"array", "list"}:
            return isinstance(value, list)

        return True

    def _matches_format(
        self,
        value: Any,
        expected_format: str,
    ) -> bool:
        text = str(value)

        formats = {
            "YYYY-MM-DD": "%Y-%m-%d",
            "DD-MM-YYYY": "%d-%m-%Y",
            "YYYY-MM-DDTHH:mm:ss": "%Y-%m-%dT%H:%M:%S",
            "DD-MM-YYYY HH:mm:ss": "%d-%m-%Y %H:%M:%S",
        }

        if expected_format in formats:
            try:
                datetime.strptime(
                    text,
                    formats[expected_format],
                )
                return True
            except ValueError:
                return False

        if expected_format.lower() == "email":
            return bool(
                re.fullmatch(
                    r"[^@\s]+@[^@\s]+\.[^@\s]+",
                    text,
                )
            )

        if expected_format.lower() == "uuid":
            return bool(
                re.fullmatch(
                    r"[0-9a-fA-F-]{36}",
                    text,
                )
            )

        return True

    def _is_empty(self, value: Any) -> bool:
        return (
            value is None
            or (
                isinstance(value, str)
                and not value.strip()
            )
        )