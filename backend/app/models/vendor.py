from sqlalchemy import Column,String,Text,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Vendor(Base):

    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    vendor_code = Column(String)

    vendor_name = Column(String)

    service_type = Column(String)

    contact_person = Column(String)

    contact_number = Column(String)

    email = Column(String)

    address = Column(Text)

    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())