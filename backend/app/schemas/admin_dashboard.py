from pydantic import BaseModel
from typing import List

class AdminKPIs(BaseModel):
    total_revenue: float
    equipment_utilization_percent: float
    active_projects: int
    outstanding_receivables: float

class RevenueDataPoint(BaseModel):
    period: str
    revenue: float

class RevenueChartData(BaseModel):
    data: List[RevenueDataPoint]

class RevenuePieDataPoint(BaseModel):
    vertical: str
    revenue: float

class RevenuePieData(BaseModel):
    data: List[RevenuePieDataPoint]

class ClientProfitabilityPoint(BaseModel):
    client_name: str
    profit: float

class ClientProfitability(BaseModel):
    data: List[ClientProfitabilityPoint]

class ReceivablesAging(BaseModel):
    days_0_30: float
    days_31_60: float
    days_61_90: float
    days_90_plus: float
