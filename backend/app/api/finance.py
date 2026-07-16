from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from app.core.database import get_db
from app.models.finance import Invoice, Expense
from app.schemas.finance import InvoiceCreate, InvoiceResponse, ExpenseCreate, ExpenseResponse
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/finance", tags=["Finance Module"])

def verify_vertical_access(user: User, vertical: str):
    if user.role == "admin":
        return True
    
    role_vertical_map = {
        "rental_manager": "rental",
        "piling_manager": "piling",
        "om_manager": "om"
    }
    
    if role_vertical_map.get(user.role) != vertical:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied for vertical: {vertical}"
        )
    return True

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    verify_vertical_access(user, invoice.vertical)
    db_invoice = Invoice(**invoice.model_dump())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    vertical: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Invoice)
    
    if user.role != "admin":
        role_vertical_map = {
            "rental_manager": "rental",
            "piling_manager": "piling",
            "om_manager": "om"
        }
        allowed_vertical = role_vertical_map.get(user.role)
        if vertical and vertical != allowed_vertical:
            raise HTTPException(status_code=403, detail="Cannot view invoices for other verticals")
        query = query.filter(Invoice.vertical == allowed_vertical)
    elif vertical:
        query = query.filter(Invoice.vertical == vertical)
        
    if status:
        query = query.filter(Invoice.status == status)
        
    return query.all()

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    verify_vertical_access(user, expense.vertical)
    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    vertical: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Expense)
    
    if user.role != "admin":
        role_vertical_map = {
            "rental_manager": "rental",
            "piling_manager": "piling",
            "om_manager": "om"
        }
        allowed_vertical = role_vertical_map.get(user.role)
        if vertical and vertical != allowed_vertical:
            raise HTTPException(status_code=403, detail="Cannot view expenses for other verticals")
        query = query.filter(Expense.vertical == allowed_vertical)
    elif vertical:
        query = query.filter(Expense.vertical == vertical)
        
    if category:
        query = query.filter(Expense.category == category)
        
    return query.all()

class FinanceDashboardResponse(BaseModel):
    total_revenue: float
    outstanding_receivables: float
    total_expenses: float

@router.get("/dashboard", response_model=FinanceDashboardResponse)
def get_finance_dashboard(
    vertical: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    invoice_query = db.query(Invoice)
    expense_query = db.query(Expense)
    
    if user.role != "admin":
        role_vertical_map = {
            "rental_manager": "rental",
            "piling_manager": "piling",
            "om_manager": "om"
        }
        allowed_vertical = role_vertical_map.get(user.role)
        if vertical and vertical != allowed_vertical:
            raise HTTPException(status_code=403, detail="Cannot view dashboard for other verticals")
        
        invoice_query = invoice_query.filter(Invoice.vertical == allowed_vertical)
        expense_query = expense_query.filter(Expense.vertical == allowed_vertical)
    elif vertical:
        invoice_query = invoice_query.filter(Invoice.vertical == vertical)
        expense_query = expense_query.filter(Expense.vertical == vertical)
        
    total_revenue = sum(inv.amount for inv in invoice_query.all() if inv.status == "paid")
    outstanding_receivables = sum(inv.amount for inv in invoice_query.all() if inv.status in ["pending", "overdue"])
    total_expenses = sum(exp.amount for exp in expense_query.all())
    
    return FinanceDashboardResponse(
        total_revenue=total_revenue,
        outstanding_receivables=outstanding_receivables,
        total_expenses=total_expenses
    )
