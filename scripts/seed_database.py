import asyncio
import json
from pathlib import Path

from sqlalchemy import text

from app.core.database import engine


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


async def seed_database():
    records_file = DATA_DIR / "source_records.json"

    with open(records_file, "r", encoding="utf-8") as file:
        records = json.load(file)

    if isinstance(records, dict):
        records = records.get("records", [])

    async with engine.begin() as connection:
        await connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS mock_target_records (
                    id BIGSERIAL PRIMARY KEY,
                    migration_key VARCHAR(255) UNIQUE NOT NULL,
                    payload JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
        )

        for index, record in enumerate(records):
            record_id = (
                record.get("id")
                or record.get("source_id")
                or record.get("record_id")
                or str(index + 1)
            )

            migration_key = f"seed-{record_id}"

            await connection.execute(
                text(
                    """
                    INSERT INTO mock_target_records
                    (migration_key, payload)
                    VALUES (:migration_key, CAST(:payload AS JSONB))
                    ON CONFLICT (migration_key) DO NOTHING
                    """
                ),
                {
                    "migration_key": migration_key,
                    "payload": json.dumps(record),
                },
            )

    print(f"Seeded {len(records)} records.")


if __name__ == "__main__":
    asyncio.run(seed_database())