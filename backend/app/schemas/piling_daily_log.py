from pydantic import BaseModel
from datetime import date
from typing import Optional

class PilingDailyLogBase(BaseModel):
    project_id: str
    log_date: date
    bores_completed: float = 0
    depth_achieved: float = 0
    cost_incurred: float = 0
    delay_days: float = 0
    rig_id: Optional[str] = None
    remarks: Optional[str] = None

class PilingDailyLogCreate(PilingDailyLogBase):
    pass

class PilingDailyLogResponse(PilingDailyLogBase):
    id: str

    class Config:
        from_attributes = True
