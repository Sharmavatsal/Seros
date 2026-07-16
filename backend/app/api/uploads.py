from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import mimetypes

from supabase import create_client, Client

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse

router = APIRouter(prefix="/uploads", tags=["Uploads & Documents"])

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BUCKET_NAME = "seros-uploads"

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured in environment")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/", response_model=DocumentResponse)
async def upload_file(
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    supabase = get_supabase_client()
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"{entity_type}/{entity_id}/{unique_filename}"
    
    # Read file content
    content = await file.read()
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    try:
        # Upload to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            file=content,
            path=file_path,
            file_options={"content-type": content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        # Create metadata record in DB
        db_doc = Document(
            file_url=public_url,
            file_name=file.filename,
            entity_type=entity_type,
            entity_id=entity_id,
            uploaded_by=user.id
        )
        
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        return db_doc
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/{entity_type}/{entity_id}", response_model=List[DocumentResponse])
def get_entity_documents(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    docs = db.query(Document).filter(
        Document.entity_type == entity_type,
        Document.entity_id == entity_id
    ).all()
    
    return docs
