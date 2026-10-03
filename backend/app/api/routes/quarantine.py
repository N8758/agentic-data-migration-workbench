from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.migration_repository import MigrationRepository


router = APIRouter(
    prefix="/api/quarantine",
    tags=["Quarantine"],
)


def serialize_object(obj):
    if hasattr(obj, "to_dict"):
        return obj.to_dict()

    if hasattr(obj, "__table__"):
        data = {}

        for column in obj.__table__.columns:
            value = getattr(obj, column.name)

            if hasattr(value, "isoformat"):
                value = value.isoformat()

            data[column.name] = value

        return data

    return obj


@router.get("/{run_id}")
def get_quarantine(
    run_id: str,
    db: Session = Depends(get_db),
):
    repository = MigrationRepository(db)

    run = repository.get_run(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Migration run not found.",
        )

    records = repository.get_quarantine(run_id)

    return {
        "success": True,
        "run_id": run_id,
        "count": len(records),
        "records": [
            serialize_object(record)
            for record in records
        ],
    }