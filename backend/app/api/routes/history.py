from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.audit_repository import AuditRepository


router = APIRouter(
    prefix="/api/history",
    tags=["History"],
)


def serialize_audit(audit):
    if hasattr(audit, "to_dict"):
        return audit.to_dict()

    if hasattr(audit, "__table__"):
        data = {}

        for column in audit.__table__.columns:
            value = getattr(audit, column.name)

            if hasattr(value, "isoformat"):
                value = value.isoformat()

            data[column.name] = value

        return data

    return audit


@router.get("")
def get_history(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    entity_type: str | None = None,
    entity_id: str | None = None,
    action: str | None = None,
    user_id: str | None = None,
    db: Session = Depends(get_db),
):
    repository = AuditRepository(db)

    if entity_type and entity_id:
        records = repository.get_by_entity(
            entity_type=entity_type,
            entity_id=entity_id,
        )

        records = records[
            offset:offset + limit
        ]

    elif action:
        records = repository.get_by_action(
            action=action,
            limit=limit,
        )

        if offset:
            records = records[offset:]

    elif user_id:
        records = repository.get_by_user(
            user_id=user_id,
            limit=limit,
        )

        if offset:
            records = records[offset:]

    else:
        records = repository.get_all(
            limit=limit,
            offset=offset,
        )

    return {
        "success": True,
        "count": len(records),
        "limit": limit,
        "offset": offset,
        "history": [
            serialize_audit(record)
            for record in records
        ],
    }