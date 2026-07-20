from sqlalchemy import Column, String, Boolean, DateTime, Text
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
        nullable=True
    )

    project_id = Column(
        UUID(as_uuid=True),
        nullable=True
    )

    ticket_no = Column(String, nullable=True)

    title = Column(String, nullable=True)

    ticket_type = Column(String, default="Breakdown")

    status = Column(String, default="Open")

    priority = Column(String, default="Medium")

    technician = Column(String, nullable=True)

    opened_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    closed_at = Column(DateTime(timezone=True), nullable=True)

    remarks = Column(Text, nullable=True)

    description = Column(String, nullable=True)

    sla_breach = Column(Boolean, default=False)
