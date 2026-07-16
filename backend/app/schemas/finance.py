from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class InvoiceBase(BaseModel):
    vertical: str
    client_id: str
    project_id: Optional[str] = None
    amount: float
    status: str = "pending"
    issue_date: date
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
    category: str
    amount: float
    date: date
    description: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
