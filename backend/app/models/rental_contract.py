from sqlalchemy import Column,String,Date,Numeric,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class RentalContract(Base):

    __tablename__ = "rental_contracts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    contract_no = Column(String)

    client_name = Column(String)

    asset_id = Column(
        UUID(as_uuid=True)
    )

    start_date = Column(Date)

    end_date = Column(Date)

    monthly_amount = Column(Numeric)

    status = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )