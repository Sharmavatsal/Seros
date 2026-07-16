from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    entity_type = Column(String, nullable=False) # e.g., 'asset', 'ticket', 'project'
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), nullable=False) # Links to User.id
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
