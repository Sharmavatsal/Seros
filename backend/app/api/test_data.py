from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.asset import Asset
from app.models.project import Project
from app.models.client import Client
from app.models.vendor import Vendor

router = APIRouter()

@router.get("/test-data")
def test_data(db: Session = Depends(get_db)):

    return {
        "assets": db.query(Asset).count(),
        "projects": db.query(Project).count(),
        "clients": db.query(Client).count(),
        "vendors": db.query(Vendor).count()
    }