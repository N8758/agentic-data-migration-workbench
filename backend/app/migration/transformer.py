from datetime import datetime
from typing import Any


class TransformationError(Exception):
    pass


class MigrationTransformer:
    def __init__(self, supported_transformations: dict[str, Any] | None = None):
        self.supported_transformations = supported_transformations or {}

    def transform(
        self,
        value: Any,
        transformation: str | None,
        parameters: dict[str, Any] | None = None,
    ) -> Any:
        parameters = parameters or {}

        if transformation in (None, "", "direct_copy"):
            return value

        if transformation == "rename_field":
            return value

        if transformation == "lowercase":
            return self._lowercase(value)

        if transformation == "lowercase_email":
            return self._lowercase_email(value)

        if transformation == "uppercase":
            return self._uppercase(value)

        if transformation == "trim":
            return self._trim(value)

        if transformation == "string_to_integer":
            return self._string_to_integer(value)

        if transformation == "string_to_float":
            return self._string_to_float(value)

        if transformation == "integer_to_string":
            return self._integer_to_string(value)

        if transformation == "float_to_string":
            return self._float_to_string(value)

        if transformation == "date_ddmmyyyy_to_yyyymmdd":
            return self._date_ddmmyyyy_to_yyyymmdd(value)

        if transformation == "datetime_ddmmyyyy_to_iso":
            return self._datetime_ddmmyyyy_to_iso(value)

        if transformation == "status_mapping":
            return self._status_mapping(value, parameters)

        if transformation == "boolean_to_string":
            return self._boolean_to_string(value)

        if transformation == "string_to_boolean":
            return self._string_to_boolean(value)

        if transformation == "null_to_default":
            return value if value is not None else parameters.get("default")

        if transformation not in self.supported_transformations:
            raise TransformationError(
                f"Unsupported transformation: {transformation}"
            )

        raise TransformationError(
            f"Transformation '{transformation}' is not implemented"
        )

    def transform_record(
        self,
        record: dict[str, Any],
        mappings: list[dict[str, Any]],
    ) -> dict[str, Any]:
        result = {}

        for mapping in mappings:
            source_field = mapping.get("source_field")
            target_field = mapping.get("target_field")
            transformation = mapping.get("transformation")
            parameters = mapping.get("parameters", {})

            if not source_field or not target_field:
                raise TransformationError(
                    "Each mapping requires source_field and target_field"
                )

            value = record.get(source_field)

            result[target_field] = self.transform(
                value=value,
                transformation=transformation,
                parameters=parameters,
            )

        return result

    def transform_records(
        self,
        records: list[dict[str, Any]],
        mappings: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        transformed = []

        for record in records:
            transformed.append(
                self.transform_record(record, mappings)
            )

        return transformed

    def _lowercase(self, value: Any) -> Any:
        if value is None:
            return None

        return str(value).lower()

    def _lowercase_email(self, value: Any) -> Any:
        if value is None:
            return None

        return str(value).strip().lower()

    def _uppercase(self, value: Any) -> Any:
        if value is None:
            return None

        return str(value).upper()

    def _trim(self, value: Any) -> Any:
        if value is None:
            return None

        return str(value).strip()

    def _string_to_integer(self, value: Any) -> Any:
        if value is None:
            return None

        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise TransformationError(
                f"Cannot convert '{value}' to integer"
            ) from exc

    def _string_to_float(self, value: Any) -> Any:
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise TransformationError(
                f"Cannot convert '{value}' to float"
            ) from exc

    def _integer_to_string(self, value: Any) -> Any:
        if value is None:
            return None

        try:
            return str(int(value))
        except (TypeError, ValueError) as exc:
            raise TransformationError(
                f"Cannot convert '{value}' to string"
            ) from exc

    def _float_to_string(self, value: Any) -> Any:
        if value is None:
            return None

        try:
            return str(float(value))
        except (TypeError, ValueError) as exc:
            raise TransformationError(
                f"Cannot convert '{value}' to string"
            ) from exc

    def _date_ddmmyyyy_to_yyyymmdd(self, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")

        text = str(value).strip()

        try:
            parsed = datetime.strptime(text, "%d-%m-%Y")
            return parsed.strftime("%Y-%m-%d")
        except ValueError as exc:
            raise TransformationError(
                f"Invalid date value: {value}"
            ) from exc

    def _datetime_ddmmyyyy_to_iso(self, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, datetime):
            return value.isoformat()

        text = str(value).strip()

        formats = [
            "%d-%m-%Y %H:%M:%S",
            "%d-%m-%Y %H:%M",
        ]

        for date_format in formats:
            try:
                parsed = datetime.strptime(text, date_format)
                return parsed.isoformat()
            except ValueError:
                continue

        raise TransformationError(
            f"Invalid datetime value: {value}"
        )

    def _status_mapping(
        self,
        value: Any,
        parameters: dict[str, Any],
    ) -> Any:
        if value is None:
            return None

        mapping = parameters.get("mapping", {})

        if not mapping:
            mapping = {
                "active": "active",
                "inactive": "inactive",
                "pending": "pending",
                "disabled": "disabled",
                "ACTIVE": "active",
                "INACTIVE": "inactive",
                "PENDING": "pending",
                "DISABLED": "disabled",
            }

        value_string = str(value)

        if value_string in mapping:
            return mapping[value_string]

        lowered = value_string.lower()

        if lowered in mapping:
            return mapping[lowered]

        raise TransformationError(
            f"No status mapping found for value: {value}"
        )

    def _boolean_to_string(self, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, bool):
            return "true" if value else "false"

        return str(value)

    def _string_to_boolean(self, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, bool):
            return value

        normalized = str(value).strip().lower()

        if normalized in {"true", "1", "yes", "y", "active"}:
            return True

        if normalized in {"false", "0", "no", "n", "inactive"}:
            return False

        raise TransformationError(
            f"Cannot convert '{value}' to boolean"
        )