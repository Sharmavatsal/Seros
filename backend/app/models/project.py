from sqlalchemy import Column,String,Text,Numeric,Date,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Project(Base):

    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    project_code = Column(String)

    project_name = Column(String)

    business_type = Column(String)

    client_id = Column(UUID(as_uuid=True))

    location = Column(Text)

    po_wo_number = Column(String)

    quantity = Column(Numeric)

    job_description = Column(Text)

    start_date = Column(Date)

    end_date = Column(Date)

    monthly_billing_potential = Column(Numeric)

    monthly_billing_actual = Column(Numeric)

    status = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())