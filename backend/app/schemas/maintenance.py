from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class MaintenanceScheduleBase(BaseModel):
    asset_id: str
    maintenance_type: str
    frequency_days: int
    next_due_date: date
    last_completed_date: Optional[date] = None

class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    pass

class MaintenanceScheduleResponse(MaintenanceScheduleBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class MaintenanceLogBase(BaseModel):
    asset_id: str
    ticket_id: Optional[str] = None
    action_taken: str
    parts_replaced: Optional[str] = None
    cost: Optional[float] = 0

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: str
    date_completed: datetime

    class Config:
        from_attributes = True
