from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal

from app.models.asset import Asset
from app.models.rental_contract import RentalContract
from app.models.rental_daily_log import RentalDailyLog

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

    active_assets = db.query(
        Asset
    ).filter(
        Asset.status == "Active"
    ).count()

    idle_assets = db.query(
        Asset
    ).filter(
        Asset.status == "Idle"
    ).count()

    utilization = 0

    if total_assets > 0:
        utilization = round(
            (active_assets / total_assets) * 100,
            2
        )

    monthly_revenue = db.query(
        func.coalesce(
            func.sum(
                RentalContract.monthly_amount
            ),
            0
        )
    ).scalar()

    total_fuel = db.query(
        func.coalesce(
            func.sum(
                RentalDailyLog.fuel_consumed
            ),
            0
        )
    ).scalar()

    breakdown_count = db.query(
        RentalDailyLog
    ).filter(
        RentalDailyLog.breakdown == True
    ).count()

    active_contracts = db.query(
        RentalContract
    ).filter(
        RentalContract.status == "Active"
    ).count()

    return {

        "equipment_utilization_percent": utilization,

        "total_assets": total_assets,

        "active_assets": active_assets,

        "idle_assets": idle_assets,

        "active_contracts": active_contracts,

        "monthly_rental_revenue": float(monthly_revenue),

        "fuel_consumption_total": float(total_fuel),

        "breakdown_count": breakdown_count
    }