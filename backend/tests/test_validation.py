from app.migration.validator import Validator


def test_valid_record():
    validator = Validator()

    schema = {
        "fields": [
            {
                "name": "customer_id",
                "type": "integer",
                "required": True,
            },
            {
                "name": "customer_name",
                "type": "string",
                "required": True,
            },
            {
                "name": "email",
                "type": "string",
                "required": True,
            },
        ]
    }

    record = {
        "customer_id": 1,
        "customer_name": "Nilesh",
        "email": "nilesh@example.com",
    }

    result = validator.validate_record(
        record,
        schema,
    )

    assert result["valid"] is True
    assert result["errors"] == []


def test_missing_required_field():
    validator = Validator()

    schema = {
        "fields": [
            {
                "name": "customer_id",
                "type": "integer",
                "required": True,
            },
            {
                "name": "customer_name",
                "type": "string",
                "required": True,
            },
        ]
    }

    record = {
        "customer_id": 1,
    }

    result = validator.validate_record(
        record,
        schema,
    )

    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_invalid_type():
    validator = Validator()

    schema = {
        "fields": [
            {
                "name": "customer_id",
                "type": "integer",
                "required": True,
            }
        ]
    }

    record = {
        "customer_id": "invalid",
    }

    result = validator.validate_record(
        record,
        schema,
    )

    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_optional_field():
    validator = Validator()

    schema = {
        "fields": [
            {
                "name": "customer_id",
                "type": "integer",
                "required": True,
            },
            {
                "name": "phone",
                "type": "string",
                "required": False,
            },
        ]
    }

    record = {
        "customer_id": 10,
    }

    result = validator.validate_record(
        record,
        schema,
    )

    assert result["valid"] is True
    assert result["errors"] == []