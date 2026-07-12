from pydantic import BaseModel
from typing import Optional

class AssetCreate(BaseModel):

    asset_code: str
    registration_no: str
    category: str
    equipment_type: str

    make: str
    model: str

    capacity: Optional[str] = None

    year_of_manufacture: Optional[int] = None

    purchase_rate: Optional[float] = None

    asset_total_cost: Optional[float] = None

    monthly_rental: Optional[float] = None

    location: Optional[str] = None

    status: str

    vendor_id: Optional[str] = None