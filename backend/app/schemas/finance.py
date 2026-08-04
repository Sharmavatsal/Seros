from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class InvoiceBase(BaseModel):
    vertical: str
    invoice_number: Optional[str] = None
    project_id: Optional[str] = None
    amount: float
    payment_status: str = "pending"
    invoice_date: Optional[date] = None
    due_date: date

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    vertical: str
    expense_type: Optional[str] = None
    project_id: Optional[str] = None
    amount: float
    expense_date: Optional[date] = None
    remarks: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
