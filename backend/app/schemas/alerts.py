from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class EquipmentAlert(BaseModel):
    asset_id: str
    asset_code: str
    alert_type: str # "Insurance" or "Fitness"
    expiry_date: date
    days_remaining: int

class RentalAlert(BaseModel):
    contract_id: str
    contract_no: str
    client_name: str
    expiry_date: date
    days_remaining: int

class OperationsAlert(BaseModel):
    asset_id: str
    asset_code: str
    log_date: date
    remarks: Optional[str]

class OMAlert(BaseModel):
    alert_type: str # "SLA Breach" or "Missed PM"
    details: str
    asset_id: str
    reference_id: str # Ticket ID or Schedule ID

class FinanceAlert(BaseModel):
    invoice_id: str
    vertical: str
    amount: float
    days_overdue: int

class UnifiedAlertResponse(BaseModel):
    equipment_alerts: List[EquipmentAlert]
    rental_alerts: List[RentalAlert]
    operations_alerts: List[OperationsAlert]
    om_alerts: List[OMAlert]
    finance_alerts: List[FinanceAlert]
