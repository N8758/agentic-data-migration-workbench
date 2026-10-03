import asyncio

from sqlalchemy import text

from app.core.database import engine


async def reset_database():
    async with engine.begin() as connection:
        await connection.execute(
            text(
                """
                DROP TABLE IF EXISTS mock_target_records
                """
            )
        )

    print("Mock target database reset successfully.")


if __name__ == "__main__":
    asyncio.run(reset_database())