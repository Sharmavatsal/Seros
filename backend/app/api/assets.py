from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_db

from app.models.asset import Asset
from app.schemas.asset import AssetCreate
from sqlalchemy.exc import IntegrityError
from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


@router.get("/")
def get_assets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    assets = db.query(Asset).all()

    return assets


from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException


@router.post("/")
def create_asset(
    data: AssetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    asset = Asset(
        asset_code=data.asset_code,
        registration_no=data.registration_no,
        category=data.category,
        equipment_type=data.equipment_type,
        make=data.make,
        model=data.model,
        capacity=data.capacity,
        year_of_manufacture=data.year_of_manufacture,
        purchase_rate=data.purchase_rate,
        asset_total_cost=data.asset_total_cost,
        monthly_rental=data.monthly_rental,
        location=data.location,
        status=data.status,
        vendor_id=data.vendor_id
    )

    try:
        db.add(asset)
        db.commit()
        db.refresh(asset)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Asset code already exists"
        )

    return {
        "message": "Asset created successfully",
        "id": str(asset.id)
    }