from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.client import Client

router = APIRouter(prefix="/orders", tags=["Orders / Active Rentals"])


def get_service_type_for_role(user: User) -> Optional[str]:
    if user.role == "admin":
        return None
    role_map = {"rental_manager": "rental", "piling_manager": "piling", "om_manager": "om"}
    return role_map.get(user.role)


@router.get("/")
def list_orders(
    service_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Project)

    role_st = get_service_type_for_role(user)
    if role_st:
        q = q.filter(Project.service_type == role_st)
    elif service_type:
        q = q.filter(Project.service_type == service_type)

    if status:
        q = q.filter(Project.status == status)
    if search:
        q = q.filter(
            (Project.po_wo_number.ilike(f"%{search}%")) |
            (Project.location.ilike(f"%{search}%"))
        )

    total = q.count()
    items = q.order_by(Project.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for p in items:
        client = db.query(Client).filter(Client.id == p.client_id).first() if p.client_id else None
        result.append({
            "id": str(p.id),
            "po_wo_number": p.po_wo_number,
            "status": p.status,
            "service_type": p.service_type,
            "client_name": client.customer_name if client else None,
            "location": p.location,
            "job_description": p.job_description,
            "quantity": int(p.quantity) if p.quantity else 0,
            "start_date": str(p.start_date) if p.start_date else None,
            "end_date": str(p.end_date) if p.end_date else None,
            "monthly_billing_potential": float(p.monthly_billing_potential) if p.monthly_billing_potential else 0,
            "monthly_billing_actual": float(p.monthly_billing_actual) if p.monthly_billing_actual else 0,
            "billing_status": p.billing_status,
        })

    return {
        "orders": result,
        "total_count": total,
        "page": page,
        "limit": limit,
    }


@router.get("/summary")
def orders_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    role_st = get_service_type_for_role(user)
    q = db.query(Project)
    if role_st:
        q = q.filter(Project.service_type == role_st)

    all_orders = q.all()
    total = len(all_orders)
    active = sum(1 for o in all_orders if o.status and o.status.lower() in ("active",))
    total_potential = sum(float(o.monthly_billing_potential or 0) for o in all_orders)
    total_actual = sum(float(o.monthly_billing_actual or 0) for o in all_orders)

    by_status = {}
    for o in all_orders:
        s = o.status or "Unknown"
        by_status[s] = by_status.get(s, 0) + 1

    return {
        "total": total,
        "active": active,
        "total_billing_potential": total_potential,
        "total_billing_actual": total_actual,
        "collection_rate": round(total_actual / total_potential * 100, 1) if total_potential > 0 else 0,
        "by_status": by_status,
    }


@router.get("/{order_id}")
def get_order(order_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == order_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Order not found")
    client = db.query(Client).filter(Client.id == p.client_id).first() if p.client_id else None
    return {
        "id": str(p.id),
        "po_wo_number": p.po_wo_number,
        "status": p.status,
        "service_type": p.service_type,
        "client_name": client.customer_name if client else None,
        "location": p.location,
        "job_description": p.job_description,
        "start_date": str(p.start_date) if p.start_date else None,
        "end_date": str(p.end_date) if p.end_date else None,
        "monthly_billing_potential": float(p.monthly_billing_potential or 0),
        "monthly_billing_actual": float(p.monthly_billing_actual or 0),
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    p = db.query(Project).filter(Project.id == order_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Order not found")
    if "status" in body:
        p.status = body["status"]
    if "monthly_billing_actual" in body:
        p.monthly_billing_actual = float(body["monthly_billing_actual"])
    db.commit()
    return {"message": "Order updated"}
