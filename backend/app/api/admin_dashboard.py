from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta, datetime, timezone
from collections import defaultdict

from app.core.database import get_db
from app.auth.dependencies import get_current_admin
from app.auth.jwt_handler import ACCESS_TOKEN_EXPIRE_MINUTES
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
    total_revenue = db.query(func.sum(Invoice.amount)).filter(Invoice.payment_status == "paid").scalar() or 0
    
    total_assets = db.query(Asset).count()
    active_assets = db.query(Asset).filter(Asset.status == "Active").count()
    utilization = (active_assets / total_assets * 100) if total_assets > 0 else 0
    
    active_projects = db.query(Project).filter(Project.status == "Active").count()
    
    outstanding = db.query(func.sum(Invoice.amount)).filter(Invoice.payment_status.in_(["pending", "overdue"])).scalar() or 0
    
    return AdminKPIs(
        total_revenue=float(total_revenue),
        equipment_utilization_percent=float(utilization),
        active_projects=active_projects,
        outstanding_receivables=float(outstanding)
    )

@router.get("/charts/revenue-line", response_model=RevenueChartData)
def get_revenue_line(
    db: Session = Depends(get_db),
    user=Depends(get_current_admin),
    period: str = 'monthly',
):
    trunc_map = {'daily': 'day', 'monthly': 'month', 'yearly': 'year'}
    trunc = trunc_map.get(period, 'month')
    fmt = {'daily': '%Y-%m-%d', 'monthly': '%Y-%m', 'yearly': '%Y'}.get(period, '%Y-%m')
    
    results = db.query(
        func.date_trunc(trunc, Invoice.invoice_date).label('period'),
        func.sum(Invoice.amount)
    ).filter(Invoice.payment_status == "paid").group_by('period').order_by('period').all()
    
    data = []
    for row in results:
        label = row[0].strftime(fmt) if row[0] else "Unknown"
        data.append(RevenueDataPoint(period=label, revenue=float(row[1] or 0)))
        
    return RevenueChartData(data=data)

@router.get("/charts/revenue-pie", response_model=RevenuePieData)
def get_revenue_pie(
    db: Session = Depends(get_db),
    user=Depends(get_current_admin),
    period: str = 'monthly',
):
    start_map = {
        'daily': date.today() - timedelta(days=30),
        'monthly': date.today() - timedelta(days=365),
    }
    start_date = start_map.get(period)

    query = db.query(
        Invoice.vertical,
        func.sum(Invoice.amount)
    ).filter(Invoice.payment_status == "paid")
    if start_date:
        query = query.filter(Invoice.invoice_date >= start_date)
    results = query.group_by(Invoice.vertical).all()
    
    data = []
    for row in results:
        vertical = row[0] or "unknown"
        revenue = float(row[1] or 0)
        data.append(RevenuePieDataPoint(vertical=vertical, revenue=revenue))
        
    return RevenuePieData(data=data)

@router.get("/charts/client-profit", response_model=ClientProfitability)
def get_client_profitability(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    from app.models.project import Project
    rev_results = db.query(
        Client.customer_name,
        func.sum(Invoice.amount)
    ).join(Project, Project.id == Invoice.project_id)\
     .join(Client, Client.id == Project.client_id)\
     .filter(Invoice.payment_status == "paid")\
     .group_by(Client.customer_name).all()
     
    data = []
    for row in rev_results:
        data.append(ClientProfitabilityPoint(client_name=row[0] or "Unknown", profit=float(row[1] or 0)))
        
    data.sort(key=lambda x: x.profit, reverse=True)
    return ClientProfitability(data=data[:10])

@router.get("/charts/receivables-aging", response_model=ReceivablesAging)
def get_receivables_aging(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    today = date.today()
    invoices = db.query(Invoice).filter(Invoice.payment_status.in_(["pending", "overdue"])).all()
    
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

@router.get("/metrics", response_model=AdminKPIs)
def get_metrics(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    """Alias for /summary — used by frontend AdminDashboard"""
    return get_summary(db=db, user=user)

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), user=Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "username": u.full_name or (u.email.split("@")[0] if u.email else "Unknown"),
            "email": u.email or "",
            "role": u.role or "unknown",
            "status": (
                "Active" if u.last_login and (now - u.last_login).total_seconds() / 60 < ACCESS_TOKEN_EXPIRE_MINUTES
                else "Inactive"
            ),
        }
        for u in users
    ]
