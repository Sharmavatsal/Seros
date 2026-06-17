from fastapi import APIRouter # type: ignore
from sqlalchemy.orm import Session # type: ignore

from app.core.database import SessionLocal
from app.models.asset import Asset
from app.models.project import Project
from app.models.client import Client
from app.models.vendor import Vendor

router = APIRouter()

@router.get("/test-data")
def test_data():

    db: Session = SessionLocal()

    return {
        "assets": db.query(Asset).count(),
        "projects": db.query(Project).count(),
        "clients": db.query(Client).count(),
        "vendors": db.query(Vendor).count()
    }