from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    closed_tickets = db.query(OMTicket).filter(OMTicket.status == "Closed").count()

    sla_breaches = db.query(OMTicket).filter(OMTicket.sla_breach == True).count()
    sla_compliance_percent = 100
    if total_tickets > 0:
        sla_compliance_percent = round(((total_tickets - sla_breaches) / total_tickets) * 100, 2)

    total_pm = db.query(OMTicket).filter(OMTicket.ticket_type == "PM").count()
    closed_pm = db.query(OMTicket).filter(OMTicket.ticket_type == "PM", OMTicket.status == "Closed").count()
    pm_completion_percent = 0
    if total_pm > 0:
        pm_completion_percent = round((closed_pm / total_pm) * 100, 2)

    repeat_failures_query = db.query(
        OMTicket.asset_id, func.count(OMTicket.id)
    ).filter(
        OMTicket.ticket_type == "Breakdown"
    ).group_by(OMTicket.asset_id).having(func.count(OMTicket.id) > 1)

    repeat_failures = repeat_failures_query.count()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "closed_tickets": closed_tickets,
        "sla_compliance_percent": sla_compliance_percent,
        "pm_completion_percent": pm_completion_percent,
        "repeat_failures": repeat_failures
    }
