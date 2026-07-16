from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ReportFilter(BaseModel):
    timeframe: str # daily, monthly, yearly
    vertical: Optional[str] = None # rental, piling, om

class ReportDataRow(BaseModel):
    date: str
    metrics: Dict[str, Any]

class ReportSummary(BaseModel):
    total_records: int
    summary_metrics: Dict[str, Any]

class ReportResponse(BaseModel):
    title: str
    vertical: str
    timeframe: str
    summary: ReportSummary
    data: List[ReportDataRow]
