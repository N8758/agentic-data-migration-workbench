import json


SYSTEM_PROMPT = """
You are an AI migration planning assistant.

Your job is to analyze one bounded source-to-target data migration.

You must follow these rules:

1. Use only the information provided in the inspection tools.
2. Use only supported transformations.
3. Never invent source fields.
4. Never invent target fields.
5. Never invent transformation rules.
6. Identify missing or incompatible fields.
7. Explain mapping risks.
8. Clearly identify uncertainty.
9. Ask clarification questions when required information is missing.
10. Do not execute the migration.
11. The user must approve the proposed migration plan before execution.
12. Return structured JSON matching the requested schema.
"""


MAPPING_PROMPT = """
Analyze the provided source schema, target schema, source records, and
supported transformation rules.

Create a proposed migration mapping.

For every source-to-target mapping:

- identify the source field
- identify the target field
- select only a supported transformation
- provide a confidence score between 0 and 1
- identify the risk level
- explain the reasoning

Also:

- identify required target fields that cannot be populated
- identify incompatible data types
- identify transformations that are required
- identify risky mappings
- identify assumptions
- generate clarification questions where necessary
- do not invent unsupported transformations

Source schema:

{source_schema}

Target schema:

{target_schema}

Source records:

{source_records}

Supported transformations:

{transformation_rules}
"""


VALIDATION_PROMPT = """
Review the proposed migration mapping against the supplied schemas and
supported transformation rules.

Determine whether the mapping is valid.

Check:

- source fields exist
- target fields exist
- required target fields are mapped
- transformations are supported
- data types are compatible
- mappings are not ambiguous
- unique fields are handled correctly
- assumptions are clearly identified

Return structured JSON containing:

- valid
- errors
- warnings
- recommendations

Source schema:

{source_schema}

Target schema:

{target_schema}

Supported transformations:

{transformation_rules}

Proposed mapping:

{mapping}
"""


def build_mapping_prompt(
    source_schema: dict,
    target_schema: dict,
    source_records: dict,
    transformation_rules: dict
) -> str:
    return MAPPING_PROMPT.format(
        source_schema=json.dumps(
            source_schema,
            indent=2,
            ensure_ascii=False
        ),
        target_schema=json.dumps(
            target_schema,
            indent=2,
            ensure_ascii=False
        ),
        source_records=json.dumps(
            source_records,
            indent=2,
            ensure_ascii=False
        ),
        transformation_rules=json.dumps(
            transformation_rules,
            indent=2,
            ensure_ascii=False
        )
    )


def build_validation_prompt(
    source_schema: dict,
    target_schema: dict,
    transformation_rules: dict,
    mapping: dict
) -> str:
    return VALIDATION_PROMPT.format(
        source_schema=json.dumps(
            source_schema,
            indent=2,
            ensure_ascii=False
        ),
        target_schema=json.dumps(
            target_schema,
            indent=2,
            ensure_ascii=False
        ),
        transformation_rules=json.dumps(
            transformation_rules,
            indent=2,
            ensure_ascii=False
        ),
        mapping=json.dumps(
            mapping,
            indent=2,
            ensure_ascii=False
        )
    )