from sqlalchemy import Column,String,Integer,Numeric,Date,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Asset(Base):

    __tablename__ = "assets_master"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    asset_code = Column(String)

    registration_no = Column(String)

    category = Column(String)

    equipment_type = Column(String)

    make = Column(String)

    model = Column(String)

    capacity = Column(String)

    year_of_manufacture = Column(Integer)

    purchase_rate = Column(Numeric)

    asset_total_cost = Column(Numeric)

    insurance_expiry = Column(Date)

    fitness_expiry = Column(Date)

    monthly_rental = Column(Numeric)

    location = Column(String)

    status = Column(String)

    vendor_id = Column(UUID(as_uuid=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())