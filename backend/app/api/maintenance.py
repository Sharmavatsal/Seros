from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from uuid import UUID

from app.core.database import get_db
from app.models.maintenance import MaintenanceSchedule, MaintenanceLog
from app.schemas.maintenance import (
    MaintenanceScheduleCreate, 
    MaintenanceScheduleResponse, 
    MaintenanceLogCreate, 
    MaintenanceLogResponse
)
from app.auth.dependencies import get_om_access
from app.models.user import User

router = APIRouter(prefix="/maintenance", tags=["Maintenance Module"])

@router.post("/schedules", response_model=MaintenanceScheduleResponse)
def create_schedule(
    schedule: MaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_om_access)
):
    db_schedule = MaintenanceSchedule(
        asset_id=UUID(schedule.asset_id),
        maintenance_type=schedule.maintenance_type,
        frequency_days=schedule.frequency_days,
        next_due_date=schedule.next_due_date,
        last_completed_date=schedule.last_completed_date
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/schedules", response_model=List[MaintenanceScheduleResponse])
def get_schedules(
    asset_id: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_om_access)
):
    query = db.query(MaintenanceSchedule)
    if asset_id:
        query = query.filter(MaintenanceSchedule.asset_id == UUID(asset_id))
    return query.all()

@router.post("/logs", response_model=MaintenanceLogResponse)
def create_log(
    log: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_om_access)
):
    db_log = MaintenanceLog(
        asset_id=UUID(log.asset_id),
        ticket_id=UUID(log.ticket_id) if log.ticket_id else None,
        action_taken=log.action_taken,
        parts_replaced=log.parts_replaced,
        cost=log.cost
    )
    db.add(db_log)
    
    # Optional: If this log corresponds to a PM schedule, we could automatically
    # update the schedule's next_due_date here based on the schedule's frequency.
    # For now, we simply create the log.
    
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[MaintenanceLogResponse])
def get_logs(
    asset_id: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_om_access)
):
    query = db.query(MaintenanceLog)
    if asset_id:
        query = query.filter(MaintenanceLog.asset_id == UUID(asset_id))
    return query.all()
