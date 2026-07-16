from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.auth.dependencies import get_db, get_om_access
from app.models.om_ticket import OMTicket

router = APIRouter(
    prefix="/om-dashboard",
    tags=["O&M Dashboard"]
)

@router.get("/summary")
def get_om_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_om_access)
):
    total_tickets = db.query(OMTicket).count()
    open_tickets = db.query(OMTicket).filter(OMTicket.status == "Open").count()
    
    # SLA %
    sla_breaches = db.query(OMTicket).filter(OMTicket.sla_breach == True).count()
    sla_compliance_percent = 100
    if total_tickets > 0:
        sla_compliance_percent = round(((total_tickets - sla_breaches) / total_tickets) * 100, 2)
        
    # PM Completion %
    total_pm = db.query(OMTicket).filter(OMTicket.ticket_type == "PM").count()
    closed_pm = db.query(OMTicket).filter(OMTicket.ticket_type == "PM", OMTicket.status == "Closed").count()
    pm_completion_percent = 0
    if total_pm > 0:
        pm_completion_percent = round((closed_pm / total_pm) * 100, 2)
        
    # Repeat Failures: For simplicity, checking tickets created for same asset multiple times recently
    # In a real app, this would be more complex logic over a time window.
    # Here, we'll just count assets that have >1 breakdown ticket.
    repeat_failures_query = db.query(
        OMTicket.asset_id, func.count(OMTicket.id)
    ).filter(
        OMTicket.ticket_type == "Breakdown"
    ).group_by(OMTicket.asset_id).having(func.count(OMTicket.id) > 1)
    
    repeat_failures = repeat_failures_query.count()

    return {
        "open_tickets": open_tickets,
        "sla_compliance_percent": sla_compliance_percent,
        "pm_completion_percent": pm_completion_percent,
        "repeat_failures": repeat_failures
    }
