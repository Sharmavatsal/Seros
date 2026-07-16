from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import SessionLocal
from app.auth.dependencies import get_db, get_piling_access
from app.models.piling_daily_log import PilingDailyLog
from app.schemas.piling_daily_log import PilingDailyLogCreate

router = APIRouter(
    prefix="/piling-logs",
    tags=["Piling Operations"]
)

@router.post("/")
def create_piling_log(
    data: PilingDailyLogCreate,
    db: Session = Depends(get_db),
    user=Depends(get_piling_access)
):
    log = PilingDailyLog(
        project_id=UUID(data.project_id),
        log_date=data.log_date,
        bores_completed=data.bores_completed,
        depth_achieved=data.depth_achieved,
        cost_incurred=data.cost_incurred,
        delay_days=data.delay_days,
        rig_id=UUID(data.rig_id) if data.rig_id else None,
        remarks=data.remarks
    )
    db.add(log)
    db.commit()
    return {"message": "Piling log created"}

@router.get("/")
def get_piling_logs(
    db: Session = Depends(get_db),
    user=Depends(get_piling_access)
):
    return db.query(PilingDailyLog).all()
