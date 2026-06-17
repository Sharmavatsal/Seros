from sqlalchemy import Column,String,Text,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Client(Base):

    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_name = Column(String)

    short_name = Column(String)

    contact_person = Column(String)

    contact_number = Column(String)

    email = Column(String)

    gst_number = Column(String)

    pan_number = Column(String)

    billing_address = Column(Text)

    project_location = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())