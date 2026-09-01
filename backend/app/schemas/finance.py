from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class InvoiceBase(BaseModel):
    vertical: str
    invoice_number: Optional[str] = None
    project_id: Optional[UUID] = None
    amount: float
    payment_status: str = "pending"
    invoice_date: Optional[date] = None
    due_date: date

class InvoiceCreate(InvoiceBase):
    @field_validator('invoice_date')
    @classmethod
    def invoice_date_not_future(cls, v):
        if v and v > date.today():
            raise ValueError('Invoice date cannot be in the future')
        return v

    @field_validator('due_date')
    @classmethod
    def due_date_validation(cls, v):
        if v <= date.today():
            raise ValueError('Due date must be a future date')
        return v

    @model_validator(mode='after')
    def check_due_after_invoice(self):
        if self.invoice_date and self.due_date and self.due_date <= self.invoice_date:
            raise ValueError('Due date must be after invoice date')
        return self

class InvoiceResponse(InvoiceBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    vertical: str
    expense_type: Optional[str] = None
    project_id: Optional[UUID] = None
    amount: float
    expense_date: Optional[date] = None
    remarks: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
