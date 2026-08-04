from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class PreRentalInspection(Base):
    __tablename__ = "pre_rental_inspections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_date = Column(Date, nullable=False)
    order_id = Column(UUID(as_uuid=True))
    equipment_id = Column(UUID(as_uuid=True))
    client_id = Column(UUID(as_uuid=True))
    duration_days = Column(Integer)
    rental_rate = Column(Numeric)
    inspection_status = Column(String, default="Pending")  # Approved, Rejected, Pending
    checklist_equipment_condition = Column(String)  # OK, Damage, Minor Issue
    checklist_functionality = Column(String)  # OK, Issue
    checklist_safety = Column(String)  # OK, Issue
    inspection_notes = Column(Text)
    document_url = Column(String(500))
    image_urls = Column(Text)  # JSON array of paths
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
