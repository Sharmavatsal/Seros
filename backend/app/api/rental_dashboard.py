from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.asset import Asset

from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/rental-dashboard",
    tags=["Rental Dashboard"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    total_assets = db.query(Asset).count()

    active_assets = db.query(Asset).filter(
        Asset.status == "Active"
    ).count()

    idle_assets = db.query(Asset).filter(
        Asset.status == "Idle"
    ).count()

    utilization = 0

    if total_assets > 0:
        utilization = round(
            (active_assets / total_assets) * 100,
            2
        )

    return {
        "total_assets": total_assets,
        "active_assets": active_assets,
        "idle_assets": idle_assets,
        "utilization_percent": utilization
    }