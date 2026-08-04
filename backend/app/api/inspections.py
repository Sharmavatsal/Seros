from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.pre_rental_inspection import PreRentalInspection

router = APIRouter(prefix="/inspections", tags=["Pre-Rental Inspections"])


@router.get("/")
def list_inspections(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(PreRentalInspection)
    if status:
        q = q.filter(PreRentalInspection.inspection_status == status)

    total = q.count()
    items = q.order_by(PreRentalInspection.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "inspections": [
            {
                "id": str(i.id),
                "inspection_date": str(i.inspection_date) if i.inspection_date else None,
                "order_id": str(i.order_id) if i.order_id else None,
                "equipment_id": str(i.equipment_id) if i.equipment_id else None,
                "client_id": str(i.client_id) if i.client_id else None,
                "duration_days": i.duration_days,
                "rental_rate": float(i.rental_rate) if i.rental_rate else 0,
                "inspection_status": i.inspection_status,
                "checklist_equipment_condition": i.checklist_equipment_condition,
                "checklist_functionality": i.checklist_functionality,
                "checklist_safety": i.checklist_safety,
                "inspection_notes": i.inspection_notes,
                "created_at": str(i.created_at) if i.created_at else None,
            }
            for i in items
        ],
        "total_count": total,
        "page": page,
    }


@router.post("/")
def create_inspection(
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    def parse_date(val):
        if val is None:
            return None
        if isinstance(val, str):
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                return None
        return val

    insp = PreRentalInspection(
        inspection_date=parse_date(body.get("inspection_date")) or datetime.now().date(),
        order_id=UUID(body["order_id"]) if body.get("order_id") else None,
        equipment_id=UUID(body["equipment_id"]) if body.get("equipment_id") else None,
        client_id=UUID(body["client_id"]) if body.get("client_id") else None,
        duration_days=body.get("duration_days"),
        rental_rate=body.get("rental_rate"),
        inspection_status=body.get("inspection_status", "Pending"),
        checklist_equipment_condition=body.get("checklist_equipment_condition"),
        checklist_functionality=body.get("checklist_functionality"),
        checklist_safety=body.get("checklist_safety"),
        inspection_notes=body.get("inspection_notes"),
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)
    return {"id": str(insp.id), "status": insp.inspection_status}


@router.put("/{inspection_id}")
def update_inspection(
    inspection_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    insp = db.query(PreRentalInspection).filter(PreRentalInspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")

    for field in [
        "inspection_status", "checklist_equipment_condition", "checklist_functionality",
        "checklist_safety", "inspection_notes", "document_url", "image_urls",
    ]:
        if field in body:
            setattr(insp, field, body[field])

    insp.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Inspection updated", "status": insp.inspection_status}
