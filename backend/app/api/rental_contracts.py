from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.rental_contract import RentalContract

from app.schemas.rental_contract import RentalContractCreate

from app.auth.dependencies import get_rental_access


router = APIRouter(
    prefix="/rental-contracts",
    tags=["Rental Contracts"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/")
def create_contract(
    data: RentalContractCreate,
    db: Session = Depends(get_db),
    user=Depends(get_rental_access)
):

    contract = RentalContract(
        contract_no=data.contract_no,
        client_name=data.client_name,
        asset_id=UUID(data.asset_id),
        start_date=data.start_date,
        end_date=data.end_date,
        monthly_amount=data.monthly_amount,
        status=data.status
    )

    db.add(contract)

    db.commit()

    return {
        "message": "Contract created"
    }


@router.get("/")
def get_contracts(
    db: Session = Depends(get_db),
    user=Depends(get_rental_access)
):

    return db.query(
        RentalContract
    ).all()