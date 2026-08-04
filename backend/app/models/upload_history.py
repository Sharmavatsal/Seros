from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_type = Column(String, nullable=False)  # vendor, equipment, order, inspection
    file_name = Column(String(255))
    uploaded_by = Column(UUID(as_uuid=True))
    row_count = Column(Integer, default=0)
    rows_updated = Column(Integer, default=0)
    status = Column(String, default="Success")  # Success, Partial, Failed
    error_message = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
