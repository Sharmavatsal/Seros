from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.auth.dependencies import get_db, get_piling_access
from app.models.piling_daily_log import PilingDailyLog
from app.models.asset import Asset

router = APIRouter(
    prefix="/piling-dashboard",
    tags=["Piling Dashboard"]
)

@router.get("/summary")
def get_piling_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_piling_access)
):
    total_bores = db.query(func.sum(PilingDailyLog.bores_completed)).scalar() or 0
    total_cost = db.query(func.sum(PilingDailyLog.cost_incurred)).scalar() or 0
    total_delays = db.query(func.sum(PilingDailyLog.delay_days)).scalar() or 0
    
    unique_days = db.query(func.count(func.distinct(PilingDailyLog.log_date))).scalar() or 1
    
    piles_per_day = round(float(total_bores) / float(unique_days), 2) if unique_days > 0 else 0
    cost_per_pile = round(float(total_cost) / float(total_bores), 2) if total_bores > 0 else 0
    
    # Rig Utilization: Active Rigs / Total Rigs
    total_rigs = db.query(Asset).filter(Asset.category == "Rig").count()
    active_rigs = db.query(Asset).filter(Asset.category == "Rig", Asset.status == "Active").count()
    rig_utilization = round((active_rigs / total_rigs) * 100, 2) if total_rigs > 0 else 0

    return {
        "piles_per_day": piles_per_day,
        "cost_per_pile": cost_per_pile,
        "rig_utilization_percent": rig_utilization,
        "delay_days": float(total_delays),
        "total_bores": float(total_bores)
    }
