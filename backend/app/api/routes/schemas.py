from pathlib import Path
import json

from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/schemas",
    tags=["Schemas"],
)

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str) -> dict:
    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Schema file not found: {filename}",
        )

    try:
        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON in {filename}: {exc}",
        )


@router.get("/source")
def get_source_schema():
    schema = load_json("source_schema.json")

    return {
        "success": True,
        "type": "source",
        "schema": schema,
    }


@router.get("/target")
def get_target_schema():
    schema = load_json("target_schema.json")

    return {
        "success": True,
        "type": "target",
        "schema": schema,
    }