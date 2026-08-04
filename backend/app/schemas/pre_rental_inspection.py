from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID


class InspectionBase(BaseModel):
    inspection_date: date
    order_id: Optional[UUID] = None
    equipment_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    duration_days: Optional[int] = None
    rental_rate: Optional[float] = None
    inspection_status: Optional[str] = "Pending"
    checklist_equipment_condition: Optional[str] = None
    checklist_functionality: Optional[str] = None
    checklist_safety: Optional[str] = None
    inspection_notes: Optional[str] = None
    document_url: Optional[str] = None
    image_urls: Optional[str] = None


class InspectionCreate(InspectionBase):
    pass


class InspectionUpdate(BaseModel):
    inspection_status: Optional[str] = None
    checklist_equipment_condition: Optional[str] = None
    checklist_functionality: Optional[str] = None
    checklist_safety: Optional[str] = None
    inspection_notes: Optional[str] = None
    document_url: Optional[str] = None
    image_urls: Optional[str] = None


class InspectionResponse(InspectionBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
