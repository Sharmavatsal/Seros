from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical = Column(String, index=True) # rental, piling, om
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    amount = Column(Numeric)
    status = Column(String, default="pending") # pending, paid, overdue
    issue_date = Column(Date)
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical = Column(String, index=True) # rental, piling, om
    category = Column(String)
    amount = Column(Numeric)
    date = Column(Date)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
