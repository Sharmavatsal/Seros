from pydantic import BaseModel
from datetime import date


class RentalDailyLogCreate(BaseModel):

    asset_id: str

    log_date: date

    working_hours: float

    fuel_consumed: float

    revenue_generated: float

    breakdown: bool = False

    remarks: str | None = None