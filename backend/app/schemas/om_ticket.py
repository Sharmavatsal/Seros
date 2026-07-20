from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OMTicketBase(BaseModel):
    asset_id: Optional[str] = None
    project_id: Optional[str] = None
    ticket_no: Optional[str] = None
    title: Optional[str] = None
    ticket_type: str = "Breakdown"
    status: str = "Open"
    priority: str = "Medium"
    technician: Optional[str] = None
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    remarks: Optional[str] = None
    description: Optional[str] = None
    sla_breach: bool = False

class OMTicketCreate(OMTicketBase):
    pass

class OMTicketResponse(OMTicketBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
