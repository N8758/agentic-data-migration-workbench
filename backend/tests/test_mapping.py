from app.migration.mapper import Mapper


def test_direct_field_mapping():
    mapper = Mapper()

    source_record = {
        "id": 1,
        "name": "Nilesh",
        "email": "nilesh@example.com",
    }

    mappings = [
        {
            "source_field": "id",
            "target_field": "customer_id",
        },
        {
            "source_field": "name",
            "target_field": "customer_name",
        },
        {
            "source_field": "email",
            "target_field": "customer_email",
        },
    ]

    result = mapper.map_record(
        source_record,
        mappings,
    )

    assert result["customer_id"] == 1
    assert result["customer_name"] == "Nilesh"
    assert result["customer_email"] == "nilesh@example.com"


def test_missing_source_field():
    mapper = Mapper()

    source_record = {
        "id": 1,
        "name": "Nilesh",
    }

    mappings = [
        {
            "source_field": "email",
            "target_field": "customer_email",
        },
    ]

    result = mapper.map_record(
        source_record,
        mappings,
    )

    assert "customer_email" not in result


def test_multiple_records():
    mapper = Mapper()

    records = [
        {
            "id": 1,
            "name": "Nilesh",
        },
        {
            "id": 2,
            "name": "Rahul",
        },
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

    results = [
        mapper.map_record(
            record,
            mappings,
        )
        for record in records
    ]

    assert len(results) == 2
    assert results[0]["customer_id"] == 1
    assert results[1]["customer_name"] == "Rahul"