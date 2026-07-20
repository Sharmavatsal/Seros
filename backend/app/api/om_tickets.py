from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.auth.dependencies import get_db, get_om_access
from app.models.om_ticket import OMTicket
from app.schemas.om_ticket import OMTicketCreate

router = APIRouter(
    prefix="/om-tickets",
    tags=["O&M Tickets"]
)

@router.post("/")
def create_ticket(
    data: OMTicketCreate,
    db: Session = Depends(get_db),
    user=Depends(get_om_access)
):
    ticket = OMTicket(
        asset_id=UUID(data.asset_id) if data.asset_id else None,
        project_id=UUID(data.project_id) if data.project_id else None,
        ticket_no=data.ticket_no,
        title=data.title,
        ticket_type=data.ticket_type,
        status=data.status,
        priority=data.priority,
        technician=data.technician,
        opened_at=data.opened_at,
        description=data.description,
        remarks=data.remarks,
        sla_breach=data.sla_breach,
    )
    db.add(ticket)
    db.commit()
    return {"message": "Ticket created"}

@router.get("/")
def get_tickets(
    db: Session = Depends(get_db),
    user=Depends(get_om_access)
):
    return db.query(OMTicket).all()
