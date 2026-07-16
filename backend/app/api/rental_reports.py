from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime
from typing import Optional

from app.core.database import SessionLocal
from app.auth.dependencies import get_db, get_rental_access
from app.models.rental_daily_log import RentalDailyLog
from app.models.asset import Asset
from app.models.rental_contract import RentalContract

router = APIRouter(
    prefix="/rental-reports",
    tags=["Rental Reports"]
)

@router.get("/daily")
def get_daily_reports(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_rental_access)
):
    query = db.query(RentalDailyLog)
    if start_date:
        query = query.filter(RentalDailyLog.log_date >= start_date)
    if end_date:
        query = query.filter(RentalDailyLog.log_date <= end_date)
    
    logs = query.all()
    
    # Enrich with asset info
    result = []
    for log in logs:
        asset = db.query(Asset).filter(Asset.id == log.asset_id).first()
        result.append({
            "log_date": log.log_date,
            "asset_code": asset.asset_code if asset else "Unknown",
            "working_hours": float(log.working_hours),
            "fuel_consumed": float(log.fuel_consumed),
            "revenue_generated": float(log.revenue_generated),
            "breakdown": log.breakdown,
            "remarks": log.remarks
        })
        
    return result

@router.get("/monthly")
def get_monthly_reports(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_rental_access)
):
    if not month:
        month = datetime.date.today().month
    if not year:
        year = datetime.date.today().year

    # Summarize revenue and fuel from daily logs for the month
    # SQLite doesn't natively support extract year/month easily without specific func, 
    # but we are using PostgreSQL.
    query = db.query(
        RentalDailyLog.asset_id,
        func.sum(RentalDailyLog.revenue_generated).label("total_revenue"),
        func.sum(RentalDailyLog.fuel_consumed).label("total_fuel"),
        func.sum(RentalDailyLog.working_hours).label("total_hours")
    ).filter(
        func.extract('month', RentalDailyLog.log_date) == month,
        func.extract('year', RentalDailyLog.log_date) == year
    ).group_by(RentalDailyLog.asset_id)
    
    summary = query.all()
    
    result = []
    for s in summary:
        asset = db.query(Asset).filter(Asset.id == s.asset_id).first()
        result.append({
            "asset_code": asset.asset_code if asset else "Unknown",
            "total_revenue": float(s.total_revenue or 0),
            "total_fuel": float(s.total_fuel or 0),
            "total_hours": float(s.total_hours or 0)
        })
        
    return result
