from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from collections import defaultdict

from app.core.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.finance import Invoice, Expense
from app.models.asset import Asset
from app.models.project import Project
from app.models.client import Client
from app.models.user import User

from app.schemas.admin_dashboard import (
    AdminKPIs,
    RevenueChartData,
    RevenueDataPoint,
    RevenuePieData,
    RevenuePieDataPoint,
    ClientProfitability,
    ClientProfitabilityPoint,
    ReceivablesAging
)

router = APIRouter(prefix="/admin-dashboard", tags=["Admin Dashboard"])

@router.get("/summary", response_model=AdminKPIs)
def get_summary(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    total_revenue = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "paid").scalar() or 0
    
    total_assets = db.query(Asset).count()
    active_assets = db.query(Asset).filter(Asset.status == "Active").count()
    utilization = (active_assets / total_assets * 100) if total_assets > 0 else 0
    
    active_projects = db.query(Project).filter(Project.status == "Active").count()
    
    outstanding = db.query(func.sum(Invoice.amount)).filter(Invoice.status.in_(["pending", "overdue"])).scalar() or 0
    
    return AdminKPIs(
        total_revenue=float(total_revenue),
        equipment_utilization_percent=float(utilization),
        active_projects=active_projects,
        outstanding_receivables=float(outstanding)
    )

@router.get("/charts/revenue-line", response_model=RevenueChartData)
def get_revenue_line(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    # Group by month for simplicity
    results = db.query(
        func.date_trunc('month', Invoice.issue_date).label('month'),
        func.sum(Invoice.amount)
    ).filter(Invoice.status == "paid").group_by('month').order_by('month').all()
    
    data = []
    for row in results:
        period = row[0].strftime("%Y-%m") if row[0] else "Unknown"
        data.append(RevenueDataPoint(period=period, revenue=float(row[1] or 0)))
        
    return RevenueChartData(data=data)

@router.get("/charts/revenue-pie", response_model=RevenuePieData)
def get_revenue_pie(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    results = db.query(
        Invoice.vertical,
        func.sum(Invoice.amount)
    ).filter(Invoice.status == "paid").group_by(Invoice.vertical).all()
    
    data = []
    for row in results:
        vertical = row[0] or "unknown"
        revenue = float(row[1] or 0)
        data.append(RevenuePieDataPoint(vertical=vertical, revenue=revenue))
        
    return RevenuePieData(data=data)

@router.get("/charts/client-profit", response_model=ClientProfitability)
def get_client_profitability(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    # Total revenue by client
    rev_results = db.query(
        Client.customer_name,
        func.sum(Invoice.amount)
    ).join(Invoice, Client.id == Invoice.client_id)\
     .filter(Invoice.status == "paid")\
     .group_by(Client.customer_name).all()
     
    # Simplifying profit to just revenue for now, as expenses might not be strictly tied to clients.
    data = []
    for row in rev_results:
        data.append(ClientProfitabilityPoint(client_name=row[0], profit=float(row[1] or 0)))
        
    # Sort and get top 10
    data.sort(key=lambda x: x.profit, reverse=True)
    return ClientProfitability(data=data[:10])

@router.get("/charts/receivables-aging", response_model=ReceivablesAging)
def get_receivables_aging(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    today = date.today()
    invoices = db.query(Invoice).filter(Invoice.status.in_(["pending", "overdue"])).all()
    
    days_0_30 = 0
    days_31_60 = 0
    days_61_90 = 0
    days_90_plus = 0
    
    for inv in invoices:
        if not inv.due_date:
            continue
        days_overdue = (today - inv.due_date).days
        
        if days_overdue <= 30:
            days_0_30 += inv.amount
        elif days_overdue <= 60:
            days_31_60 += inv.amount
        elif days_overdue <= 90:
            days_61_90 += inv.amount
        else:
            days_90_plus += inv.amount
            
    return ReceivablesAging(
        days_0_30=float(days_0_30),
        days_31_60=float(days_31_60),
        days_61_90=float(days_61_90),
        days_90_plus=float(days_90_plus)
    )

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    users = db.query(User).all()
    return [{"id": str(u.id), "username": u.username, "role": u.role} for u in users]
