from app.migration.dry_runner import DryRunner


def test_dry_run_accepts_valid_record():
    runner = DryRunner(
        target_schema={
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
        },
        validation_rules=[],
        supported_transformations=[],
    )

    records = [
        {
            "id": 1,
            "name": "Nilesh",
        }
    ]

    mappings = [
        {
            "source_field": "id",
            "target_field": "customer_id",
        },
        {
            "source_field": "name",
            "target_field": "customer_name",
        },
    ]

    result = runner.run(
        source_records=records,
        mappings=mappings,
        run_id="test-run-1",
    )

    assert result["source_count"] == 1
    assert result["accepted_count"] == 1
    assert result["rejected_count"] == 0


def test_dry_run_rejects_invalid_record():
    runner = DryRunner(
        target_schema={
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
        },
        validation_rules=[],
        supported_transformations=[],
    )

    records = [
        {
            "id": "invalid",
            "name": "Nilesh",
        }
    ]

    mappings = [
        {
            "source_field": "id",
            "target_field": "customer_id",
        },
        {
            "source_field": "name",
            "target_field": "customer_name",
        },
    ]

    result = runner.run(
        source_records=records,
        mappings=mappings,
        run_id="test-run-2",
    )

    assert result["source_count"] == 1
    assert result["rejected_count"] == 1