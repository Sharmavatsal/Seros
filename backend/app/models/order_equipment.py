from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class OrderEquipment(Base):
    __tablename__ = "order_equipment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True))
    equipment_id = Column(UUID(as_uuid=True))
    quantity_allocated = Column(Integer, default=1)
    rental_start_date = Column(Date)
    rental_end_date = Column(Date)
    rental_rate_per_month = Column(Numeric)
    total_rental_amount = Column(Numeric)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
