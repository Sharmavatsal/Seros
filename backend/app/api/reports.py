# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import csv
import io
from datetime import datetime
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except ImportError:
    pass

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.finance import Invoice
from app.schemas.reports import ReportResponse, ReportSummary, ReportDataRow

router = APIRouter(prefix="/reports", tags=["Reports Engine"])

def validate_vertical_access(user: User, vertical: str = None):
    if user.role == "admin":
        return vertical if vertical else "all"
    
    role_map = {
        "rental_manager": "rental",
        "piling_manager": "piling",
        "om_manager": "om"
    }
    allowed = role_map.get(user.role)
    if vertical and vertical != allowed:
        raise HTTPException(status_code=403, detail="Cannot access reports for other verticals")
    return allowed

def fetch_report_data(db: Session, vertical: str, timeframe: str):
    # Dummy aggregation logic based on Invoices for demonstration.
    # In a real scenario, this would join with RentalDailyLog, PilingDailyLog, etc.
    query = db.query(
        func.date_trunc('day' if timeframe == 'daily' else 'month', Invoice.issue_date).label('period'),
        func.sum(Invoice.amount),
        func.count(Invoice.id)
    ).filter(Invoice.status == "paid")
    
    if vertical != "all":
        query = query.filter(Invoice.vertical == vertical)
        
    results = query.group_by('period').order_by('period').all()
    
    data = []
    total_rev = 0
    total_count = 0
    for row in results:
        if not row[0]: continue
        period_str = row[0].strftime("%Y-%m-%d" if timeframe == 'daily' else "%Y-%m")
        rev = float(row[1] or 0)
        cnt = int(row[2] or 0)
        data.append(ReportDataRow(date=period_str, metrics={"revenue": rev, "count": cnt}))
        total_rev += rev
        total_count += cnt
        
    summary = ReportSummary(
        total_records=total_count,
        summary_metrics={"total_revenue": total_rev}
    )
    
    return data, summary

@router.get("/data", response_model=ReportResponse)
def get_report_data(
    timeframe: str = "monthly", 
    vertical: str = None, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    valid_vertical = validate_vertical_access(user, vertical)
    data, summary = fetch_report_data(db, valid_vertical, timeframe)
    
    return ReportResponse(
        title=f"{valid_vertical.capitalize()} {timeframe.capitalize()} Report",
        vertical=valid_vertical,
        timeframe=timeframe,
        summary=summary,
        data=data
    )

@router.get("/export/csv")
def export_csv(
    timeframe: str = "monthly", 
    vertical: str = None, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    valid_vertical = validate_vertical_access(user, vertical)
    data, summary = fetch_report_data(db, valid_vertical, timeframe)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Date", "Revenue", "Count"])
    for row in data:
        writer.writerow([row.date, row.metrics.get("revenue"), row.metrics.get("count")])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=report_{valid_vertical}_{timeframe}.csv"
    return response

@router.get("/export/pdf")
def export_pdf(
    timeframe: str = "monthly", 
    vertical: str = None, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    valid_vertical = validate_vertical_access(user, vertical)
    data, summary = fetch_report_data(db, valid_vertical, timeframe)
    
    buffer = io.BytesIO()
    
    try:
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(100, 750, f"{valid_vertical.capitalize()} {timeframe.capitalize()} Report")
        c.drawString(100, 730, f"Total Revenue: {summary.summary_metrics.get('total_revenue')}")
        c.drawString(100, 710, f"Total Records: {summary.total_records}")
        
        y = 670
        c.drawString(100, y, "Date | Revenue | Count")
        y -= 20
        for row in data:
            c.drawString(100, y, f"{row.date} | {row.metrics.get('revenue')} | {row.metrics.get('count')}")
            y -= 20
            if y < 50:
                c.showPage()
                y = 750
                
        c.save()
    except NameError:
        raise HTTPException(status_code=500, detail="PDF generation library not installed")
        
    buffer.seek(0)
    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=report_{valid_vertical}_{timeframe}.pdf"
    return response
