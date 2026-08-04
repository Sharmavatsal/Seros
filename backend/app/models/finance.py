from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical = Column(String, index=True)
    invoice_number = Column(String, nullable=True)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    amount = Column(Numeric)
    invoice_date = Column(Date, nullable=True)
    due_date = Column(Date)
    payment_status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def status(self):
        return self.payment_status

    @status.setter
    def status(self, value):
        self.payment_status = value

    @property
    def issue_date(self):
        return self.invoice_date

    @issue_date.setter
    def issue_date(self, value):
        self.invoice_date = value

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical = Column(String, index=True)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    expense_type = Column(String, nullable=True)
    amount = Column(Numeric)
    expense_date = Column(Date, nullable=True)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def category(self):
        return self.expense_type

    @category.setter
    def category(self, value):
        self.expense_type = value

    @property
    def date(self):
        return self.expense_date

    @date.setter
    def date(self, value):
        self.expense_date = value

    @property
    def description(self):
        return self.remarks

    @description.setter
    def description(self, value):
        self.remarks = value
