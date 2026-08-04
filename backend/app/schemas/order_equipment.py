from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID


class OrderEquipmentBase(BaseModel):
    order_id: UUID
    equipment_id: Optional[UUID] = None
    quantity_allocated: Optional[int] = 1
    rental_start_date: Optional[date] = None
    rental_end_date: Optional[date] = None
    rental_rate_per_month: Optional[float] = None
    total_rental_amount: Optional[float] = None


class OrderEquipmentCreate(OrderEquipmentBase):
    pass


class OrderEquipmentResponse(OrderEquipmentBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
