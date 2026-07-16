from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
import datetime

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User

from app.models.asset import Asset
from app.models.rental_contract import RentalContract
from app.models.rental_daily_log import RentalDailyLog
from app.models.om_ticket import OMTicket
from app.models.maintenance import MaintenanceSchedule
from app.models.finance import Invoice

from app.schemas.alerts import (
    UnifiedAlertResponse,
    EquipmentAlert,
    RentalAlert,
    OperationsAlert,
    OMAlert,
    FinanceAlert
)

router = APIRouter(prefix="/alerts", tags=["Alerts Engine"])

@router.get("/", response_model=UnifiedAlertResponse)
def get_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    today = datetime.date.today()
    thirty_days_from_now = today + datetime.timedelta(days=30)
    seven_days_from_now = today + datetime.timedelta(days=7)
    
    role = user.role
    
    equipment_alerts = []
    rental_alerts = []
    operations_alerts = []
    om_alerts = []
    finance_alerts = []
    
    # EQUIPMENT ALERTS (Insurance / Fitness < 30 days)
    if role in ["admin", "rental_manager", "piling_manager", "om_manager"]:
        assets_ins = db.query(Asset).filter(
            Asset.insurance_expiry != None,
            Asset.insurance_expiry >= today,
            Asset.insurance_expiry <= thirty_days_from_now
        ).all()
        for a in assets_ins:
            days = (a.insurance_expiry - today).days
            equipment_alerts.append(EquipmentAlert(
                asset_id=str(a.id), asset_code=a.asset_code, alert_type="Insurance",
                expiry_date=a.insurance_expiry, days_remaining=days
            ))
            
        assets_fit = db.query(Asset).filter(
            Asset.fitness_expiry != None,
            Asset.fitness_expiry >= today,
            Asset.fitness_expiry <= thirty_days_from_now
        ).all()
        for a in assets_fit:
            days = (a.fitness_expiry - today).days
            equipment_alerts.append(EquipmentAlert(
                asset_id=str(a.id), asset_code=a.asset_code, alert_type="Fitness",
                expiry_date=a.fitness_expiry, days_remaining=days
            ))
            
    # RENTAL ALERTS (Contracts < 7 days)
    if role in ["admin", "rental_manager"]:
        contracts = db.query(RentalContract).filter(
            RentalContract.end_date != None,
            RentalContract.status == "Active",
            RentalContract.end_date >= today,
            RentalContract.end_date <= seven_days_from_now
        ).all()
        for c in contracts:
            days = (c.end_date - today).days
            rental_alerts.append(RentalAlert(
                contract_id=str(c.id), contract_no=c.contract_no, client_name=c.client_name,
                expiry_date=c.end_date, days_remaining=days
            ))
            
    # OPERATIONS ALERTS (Breakdown)
    if role in ["admin", "rental_manager", "piling_manager", "om_manager"]:
        active_assets = db.query(Asset).filter(Asset.status == "Active").all()
        for a in active_assets:
            latest_log = db.query(RentalDailyLog).filter(
                RentalDailyLog.asset_id == a.id
            ).order_by(desc(RentalDailyLog.log_date)).first()
            
            if latest_log and latest_log.breakdown:
                operations_alerts.append(OperationsAlert(
                    asset_id=str(a.id), asset_code=a.asset_code,
                    log_date=latest_log.log_date, remarks=latest_log.remarks
                ))
                
    # O&M ALERTS (SLA breach, missed PM)
    if role in ["admin", "om_manager"]:
        # SLA breach tickets
        tickets = db.query(OMTicket).filter(OMTicket.status == "Open", OMTicket.sla_breach == True).all()
        for t in tickets:
            om_alerts.append(OMAlert(
                alert_type="SLA Breach", details=f"Ticket {t.ticket_type} breached SLA",
                asset_id=str(t.asset_id), reference_id=str(t.id)
            ))
            
        # Missed PM schedules
        schedules = db.query(MaintenanceSchedule).filter(
            MaintenanceSchedule.next_due_date != None,
            MaintenanceSchedule.next_due_date < today
        ).all()
        for s in schedules:
            om_alerts.append(OMAlert(
                alert_type="Missed PM", details=f"Missed PM ({s.maintenance_type}) due on {s.next_due_date}",
                asset_id=str(s.asset_id), reference_id=str(s.id)
            ))
            
    # FINANCE ALERTS (Invoice > 45 days overdue)
    # E.g. Admins see all, Managers see their vertical
    if role in ["admin", "rental_manager", "piling_manager", "om_manager"]:
        forty_five_days_ago = today - datetime.timedelta(days=45)
        query = db.query(Invoice).filter(
            Invoice.status.in_(["pending", "overdue"]),
            Invoice.due_date != None,
            Invoice.due_date < forty_five_days_ago
        )
        
        if role != "admin":
            role_map = {"rental_manager": "rental", "piling_manager": "piling", "om_manager": "om"}
            query = query.filter(Invoice.vertical == role_map[role])
            
        overdue_invoices = query.all()
        for inv in overdue_invoices:
            days = (today - inv.due_date).days
            finance_alerts.append(FinanceAlert(
                invoice_id=str(inv.id), vertical=inv.vertical,
                amount=float(inv.amount), days_overdue=days
            ))
            
    return UnifiedAlertResponse(
        equipment_alerts=equipment_alerts,
        rental_alerts=rental_alerts,
        operations_alerts=operations_alerts,
        om_alerts=om_alerts,
        finance_alerts=finance_alerts
    )
