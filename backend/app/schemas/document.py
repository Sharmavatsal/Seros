from pydantic import BaseModel, UUID4
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID4
    file_url: str
    file_name: str
    entity_type: str
    entity_id: UUID4
    uploaded_by: UUID4
    uploaded_at: datetime

    class Config:
        from_attributes = True
