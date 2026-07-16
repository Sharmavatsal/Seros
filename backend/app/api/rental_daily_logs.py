from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from uuid import UUID

from app.auth.dependencies import get_db
from app.auth.dependencies import get_rental_access

from app.models.rental_daily_log import RentalDailyLog

from app.schemas.rental_daily_log import (
    RentalDailyLogCreate
)

router = APIRouter(
    prefix="/rental-daily-logs",
    tags=["Rental Daily Logs"]
)


@router.post("/")
def create_log(
    data: RentalDailyLogCreate,
    db: Session = Depends(get_db),
    user=Depends(get_rental_access)
):

    log = RentalDailyLog(
        asset_id=UUID(data.asset_id),
        log_date=data.log_date,
        working_hours=data.working_hours,
        fuel_consumed=data.fuel_consumed,
        revenue_generated=data.revenue_generated,
        breakdown=data.breakdown,
        remarks=data.remarks
    )

    db.add(log)
    db.commit()

    return {
        "message": "Daily log created"
    }


@router.get("/")
def get_logs(
    db: Session = Depends(get_db),
    user=Depends(get_rental_access)
):

    return db.query(
        RentalDailyLog
    ).all()