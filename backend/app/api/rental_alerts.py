from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
import datetime

from app.core.database import SessionLocal
from app.auth.dependencies import get_db, get_rental_access
from app.models.asset import Asset
from app.models.rental_contract import RentalContract
from app.models.rental_daily_log import RentalDailyLog

router = APIRouter(
    prefix="/rental-alerts",
    tags=["Rental Alerts"]
)

@router.get("/")
def get_rental_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_rental_access)
):
    today = datetime.date.today()
    thirty_days_from_now = today + datetime.timedelta(days=30)
    seven_days_from_now = today + datetime.timedelta(days=7)

    # 1. Insurance expiry within 30 days
    insurance_expiring = db.query(Asset).filter(
        Asset.insurance_expiry != None,
        Asset.insurance_expiry >= today,
        Asset.insurance_expiry <= thirty_days_from_now
    ).all()

    # 2. Fitness expiry within 30 days
    fitness_expiring = db.query(Asset).filter(
        Asset.fitness_expiry != None,
        Asset.fitness_expiry >= today,
        Asset.fitness_expiry <= thirty_days_from_now
    ).all()

    # 3. Contract expiry within 7 days
    contracts_expiring = db.query(RentalContract).filter(
        RentalContract.end_date != None,
        RentalContract.status == "Active",
        RentalContract.end_date >= today,
        RentalContract.end_date <= seven_days_from_now
    ).all()

    # 4. Equipment breakdown (Latest log per asset has breakdown == True)
    # Get the latest log date for each asset, then check if it's a breakdown.
    # We can simplify by just getting the most recent logs that indicate a breakdown.
    # To keep it simple, let's find assets where there's a breakdown log within the last 7 days and we can just flag them.
    # Or, we can just fetch the most recent log for all active assets.
    active_assets = db.query(Asset).filter(Asset.status == "Active").all()
    breakdown_alerts = []
    
    for asset in active_assets:
        latest_log = db.query(RentalDailyLog).filter(
            RentalDailyLog.asset_id == asset.id
        ).order_by(desc(RentalDailyLog.log_date)).first()
        
        if latest_log and latest_log.breakdown:
            breakdown_alerts.append({
                "asset_code": asset.asset_code,
                "asset_id": asset.id,
                "log_date": latest_log.log_date,
                "remarks": latest_log.remarks
            })

    return {
        "insurance_expiry": [
            {"asset_code": a.asset_code, "expiry_date": a.insurance_expiry, "id": a.id} 
            for a in insurance_expiring
        ],
        "fitness_expiry": [
            {"asset_code": a.asset_code, "expiry_date": a.fitness_expiry, "id": a.id}
            for a in fitness_expiring
        ],
        "contract_expiry": [
            {"contract_no": c.contract_no, "client_name": c.client_name, "expiry_date": c.end_date, "id": c.id}
            for c in contracts_expiring
        ],
        "equipment_breakdowns": breakdown_alerts
    }
