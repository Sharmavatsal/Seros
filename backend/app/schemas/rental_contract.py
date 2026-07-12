from pydantic import BaseModel
from datetime import date


class RentalContractCreate(BaseModel):

    contract_no: str

    client_name: str

    asset_id: str

    start_date: date

    end_date: date

    monthly_amount: float

    status: str