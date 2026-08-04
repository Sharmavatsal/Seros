from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class UploadHistoryResponse(BaseModel):
    id: UUID
    file_type: str
    file_name: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    row_count: Optional[int] = 0
    rows_updated: Optional[int] = 0
    status: Optional[str] = "Success"
    error_message: Optional[str] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
