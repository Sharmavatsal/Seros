from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.asset import Asset
from app.models.vendor import Vendor

router = APIRouter(prefix="/equipment", tags=["Equipment Inventory"])


def get_service_type_for_role(user: User) -> Optional[str]:
    if user.role == "admin":
        return None  # sees all
    role_map = {"rental_manager": "rental", "piling_manager": "piling", "om_manager": "om"}
    return role_map.get(user.role)


@router.get("/")
def list_equipment(
    service_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Asset)

    role_st = get_service_type_for_role(user)
    if role_st:
        q = q.filter(Asset.service_type == role_st)
    elif service_type:
        q = q.filter(Asset.service_type == service_type)

    if status:
        q = q.filter(Asset.status == status)
    if location:
        q = q.filter(Asset.location.ilike(f"%{location}%"))
    if category:
        q = q.filter(Asset.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(
            (Asset.registration_no.ilike(f"%{search}%")) |
            (Asset.equipment_type.ilike(f"%{search}%")) |
            (Asset.make.ilike(f"%{search}%"))
        )

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    return {
        "equipment": [
            {
                "id": str(a.id),
                "asset_code": a.asset_code,
                "registration_no": a.registration_no,
                "category": a.category,
                "equipment_type": a.equipment_type,
                "make": a.make,
                "model": a.model,
                "capacity": a.capacity,
                "year_of_manufacture": a.year_of_manufacture,
                "status": a.status,
                "monthly_rental": float(a.monthly_rental) if a.monthly_rental else 0,
                "location": a.location,
                "service_type": a.service_type,
            }
            for a in items
        ],
        "total_count": total,
        "page": page,
        "limit": limit,
    }


@router.get("/summary")
def equipment_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    role_st = get_service_type_for_role(user)
    q = db.query(Asset)
    if role_st:
        q = q.filter(Asset.service_type == role_st)

    all_assets = q.all()
    total = len(all_assets)
    by_status = {}
    by_type = {}
    by_location = {}

    for a in all_assets:
        s = a.status or "Unknown"
        by_status[s] = by_status.get(s, 0) + 1
        t = a.equipment_type or "Unknown"
        by_type[t] = by_type.get(t, 0) + 1
        loc = a.location or "Unknown"
        if loc not in by_location:
            by_location[loc] = {"total": 0, "available": 0, "in_use": 0, "maintenance": 0}
        by_location[loc]["total"] += 1
        if s.lower() in ("available",):
            by_location[loc]["available"] += 1
        elif s.lower() in ("in operation", "rented"):
            by_location[loc]["in_use"] += 1
        elif s.lower() in ("maintenance",):
            by_location[loc]["maintenance"] += 1

    return {
        "total": total,
        "by_status": by_status,
        "by_type": by_type,
        "by_location": by_location,
    }


@router.put("/{asset_id}/status")
def update_asset_status(
    asset_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    new_status = body.get("status")
    if new_status:
        asset.status = new_status
    db.commit()
    return {"message": "Status updated", "new_status": asset.status}
