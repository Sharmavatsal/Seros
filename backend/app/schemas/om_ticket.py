from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OMTicketBase(BaseModel):
    asset_id: str
    ticket_type: str = "Breakdown"
    status: str = "Open"
    priority: str = "Medium"
    sla_breach: bool = False
    technician_id: Optional[str] = None
    description: Optional[str] = None

class OMTicketCreate(OMTicketBase):
    pass

class OMTicketResponse(OMTicketBase):
    id: str
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
