from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.database import get_db

from app.models.asset import Asset
from app.models.rental_contract import RentalContract
from app.models.rental_daily_log import RentalDailyLog

from app.auth.dependencies import get_rental_access

router = APIRouter(
    prefix="/rental-dashboard",
    tags=["Rental Dashboard"]
)

RENTAL_FILTER = Asset.service_type == "rental"


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_rental_access)
):

    total_assets = db.query(Asset).filter(RENTAL_FILTER).count()

    active_assets = db.query(
        Asset
    ).filter(
        RENTAL_FILTER,
        Asset.status == "Active"
    ).count()

    idle_assets = db.query(
        Asset
    ).filter(
        RENTAL_FILTER,
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


@router.get("/trends")
def dashboard_trends(
    db: Session = Depends(get_db),
    current_user=Depends(get_rental_access)
):
    month_labels = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
                    7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}

    revenue_rows = db.query(
        extract('month', RentalContract.start_date).label('m'),
        func.sum(RentalContract.monthly_amount)
    ).group_by('m').order_by('m').all()
    revenue_trend = [{"month": month_labels.get(int(r[0]), str(int(r[0]))), "revenue": float(r[1] or 0)} for r in revenue_rows]

    fuel_rows = db.query(
        extract('month', RentalDailyLog.log_date).label('m'),
        func.sum(RentalDailyLog.fuel_consumed)
    ).filter(RentalDailyLog.log_date != None).group_by('m').order_by('m').all()
    fuel_trend = [{"month": month_labels.get(int(r[0]), str(int(r[0]))), "liters": float(r[1] or 0)} for r in fuel_rows]

    breakdown_rows = db.query(
        extract('month', RentalDailyLog.log_date).label('m'),
        func.count(RentalDailyLog.id)
    ).filter(RentalDailyLog.breakdown == True, RentalDailyLog.log_date != None).group_by('m').order_by('m').all()
    breakdown_trend = [{"month": month_labels.get(int(r[0]), str(int(r[0]))), "incidents": int(r[1] or 0)} for r in breakdown_rows]

    fuel_total = db.query(func.coalesce(func.sum(RentalDailyLog.fuel_consumed), 0)).scalar()

    return {
        "revenue_trend": revenue_trend,
        "fuel_trend": fuel_trend,
        "breakdown_trend": breakdown_trend,
        "fuel_consumption_total": float(fuel_total),
    }