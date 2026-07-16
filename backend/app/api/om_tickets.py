from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import SessionLocal
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
        asset_id=UUID(data.asset_id),
        ticket_type=data.ticket_type,
        status=data.status,
        priority=data.priority,
        sla_breach=data.sla_breach,
        technician_id=UUID(data.technician_id) if data.technician_id else None,
        description=data.description
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
