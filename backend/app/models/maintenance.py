from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets_master.id"), nullable=False)
    maintenance_type = Column(String) # e.g., '250hr', 'Monthly'
    frequency_days = Column(Integer)
    next_due_date = Column(Date)
    last_completed_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets_master.id"), nullable=False)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("om_tickets.id"), nullable=True)
    action_taken = Column(String)
    parts_replaced = Column(String, nullable=True)
    cost = Column(Numeric, default=0)
    date_completed = Column(DateTime(timezone=True), server_default=func.now())
