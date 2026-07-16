from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class OMTicket(Base):

    __tablename__ = "om_tickets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    asset_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    ticket_type = Column(String, default="Breakdown") # Breakdown, PM
    
    status = Column(String, default="Open") # Open, Closed
    
    priority = Column(String, default="Medium")
    
    sla_breach = Column(Boolean, default=False)
    
    technician_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    description = Column(String)
