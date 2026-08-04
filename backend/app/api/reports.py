# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import csv
import io
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.finance import Invoice
from app.schemas.reports import ReportResponse, ReportSummary, ReportDataRow

router = APIRouter(prefix="/reports", tags=["Reports Engine"])

COLOR_PRIMARY = HexColor("#3B82F6")
COLOR_DARK = HexColor("#1E1E1E")
COLOR_SURFACE = HexColor("#F8F9FA")
COLOR_BORDER = HexColor("#DEE2E6")
COLOR_TEXT = HexColor("#212529")
COLOR_MUTED = HexColor("#6C757D")
COLOR_SUCCESS = HexColor("#10B981")
COLOR_HEADER_BG = HexColor("#1E293B")
COLOR_ROW_ALT = HexColor("#F1F5F9")


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
    query = db.query(
        func.date_trunc('day' if timeframe == 'daily' else 'month', Invoice.invoice_date).label('period'),
        func.sum(Invoice.amount),
        func.count(Invoice.id)
    ).filter(Invoice.payment_status == "paid")

    if vertical != "all":
        query = query.filter(Invoice.vertical == vertical)

    results = query.group_by('period').order_by('period').all()

    data = []
    total_rev = 0
    total_count = 0
    for row in results:
        if not row[0]:
            continue
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


def _build_pdf_table(data, total_rev, total_count):
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9, textColor=white, fontName='Helvetica-Bold',
        alignment=TA_CENTER, leading=12
    )
    cell_style = ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9, textColor=COLOR_TEXT, fontName='Helvetica',
        alignment=TA_CENTER, leading=12
    )
    cell_left = ParagraphStyle(
        'TableCellLeft', parent=cell_style, alignment=TA_LEFT
    )
    cell_right = ParagraphStyle(
        'TableCellRight', parent=cell_style, alignment=TA_RIGHT
    )

    table_data = [[
        Paragraph("Period", header_style),
        Paragraph("Revenue", header_style),
        Paragraph("Transactions", header_style),
        Paragraph("Avg / Transaction", header_style),
    ]]

    for row in data:
        rev = row.metrics.get("revenue", 0)
        cnt = row.metrics.get("count", 0)
        avg = rev / cnt if cnt else 0
        table_data.append([
            Paragraph(str(row.date), cell_left),
            Paragraph(f"${rev:,.2f}", cell_right),
            Paragraph(str(cnt), cell_style),
            Paragraph(f"${avg:,.2f}", cell_right),
        ])

    avg_total = total_rev / total_count if total_count else 0
    summary_style = ParagraphStyle(
        'SummaryCell', parent=styles['Normal'],
        fontSize=9, textColor=white, fontName='Helvetica-Bold',
        alignment=TA_CENTER, leading=12
    )
    summary_left = ParagraphStyle('SummaryLeft', parent=summary_style, alignment=TA_LEFT)
    summary_right = ParagraphStyle('SummaryRight', parent=summary_style, alignment=TA_RIGHT)
    table_data.append([
        Paragraph("TOTAL", summary_left),
        Paragraph(f"${total_rev:,.2f}", summary_right),
        Paragraph(str(total_count), summary_style),
        Paragraph(f"${avg_total:,.2f}", summary_right),
    ])

    col_widths = [1.8 * inch, 1.7 * inch, 1.3 * inch, 1.7 * inch]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -2), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [white, COLOR_ROW_ALT]),
        ('BACKGROUND', (0, -1), (-1, -1), COLOR_HEADER_BG),
        ('TEXTCOLOR', (0, -1), (-1, -1), white),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, COLOR_PRIMARY),
    ]

    table.setStyle(TableStyle(style_cmds))
    return table


def _add_page_footer(canvas_obj, doc):
    canvas_obj.saveState()
    page_width, page_height = letter
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.setFillColor(COLOR_MUTED)
    canvas_obj.drawString(
        doc.leftMargin, 0.5 * inch,
        "SEROSOPS Business Dashboard  |  Confidential"
    )
    canvas_obj.drawRightString(
        page_width - doc.rightMargin, 0.5 * inch,
        f"Page {doc.page}"
    )
    canvas_obj.setStrokeColor(COLOR_BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(doc.leftMargin, 0.65 * inch, page_width - doc.rightMargin, 0.65 * inch)
    canvas_obj.restoreState()


def _build_pdf(valid_vertical, timeframe, data, summary, user):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.75 * inch, bottomMargin=0.9 * inch
    )
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle(
        'ReportTitle', parent=styles['Title'],
        fontSize=22, textColor=COLOR_HEADER_BG,
        fontName='Helvetica-Bold', spaceAfter=4, leading=28
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle', parent=styles['Normal'],
        fontSize=11, textColor=COLOR_MUTED,
        fontName='Helvetica', spaceAfter=6
    )
    section_style = ParagraphStyle(
        'SectionTitle', parent=styles['Heading2'],
        fontSize=13, textColor=COLOR_HEADER_BG,
        fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=10, leading=18
    )
    kpi_label = ParagraphStyle(
        'KPILabel', parent=styles['Normal'],
        fontSize=8, textColor=COLOR_MUTED, fontName='Helvetica',
        alignment=TA_CENTER, leading=11
    )
    kpi_value = ParagraphStyle(
        'KPIValue', parent=styles['Normal'],
        fontSize=16, textColor=COLOR_PRIMARY, fontName='Helvetica-Bold',
        alignment=TA_CENTER, leading=22
    )

    vertical_label = valid_vertical.capitalize() if valid_vertical != "all" else "All Verticals"
    report_date = datetime.now().strftime("%B %d, %Y")

    elements.append(Paragraph("SEROSOPS", ParagraphStyle(
        'Brand', parent=styles['Normal'],
        fontSize=10, textColor=COLOR_PRIMARY, fontName='Helvetica-Bold',
        spaceAfter=2, letterSpacing=3
    )))
    elements.append(HRFlowable(width="100%", thickness=2, color=COLOR_PRIMARY, spaceAfter=14))

    elements.append(Paragraph(f"{vertical_label} — {timeframe.capitalize()} Report", title_style))
    elements.append(Paragraph(f"Generated on {report_date}  |  Period: {timeframe.capitalize()}", subtitle_style))
    elements.append(Paragraph(
        f"Prepared for: {user.full_name or user.email}",
        ParagraphStyle('PreparedFor', parent=subtitle_style, fontSize=9, textColor=COLOR_MUTED)
    ))

    elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceBefore=8, spaceAfter=16))

    total_rev = summary.summary_metrics.get("total_revenue", 0)
    total_count = summary.total_records
    avg_rev = total_rev / total_count if total_count else 0

    kpi_data = [[
        Paragraph("Total Revenue", kpi_label),
        Paragraph("Total Transactions", kpi_label),
        Paragraph("Avg / Period", kpi_label),
    ], [
        Paragraph(f"${total_rev:,.2f}", kpi_value),
        Paragraph(f"{total_count:,}", kpi_value),
        Paragraph(f"${avg_rev:,.2f}", kpi_value),
    ]]
    kpi_table = Table(kpi_data, colWidths=[2.2 * inch, 2.2 * inch, 2.2 * inch])
    kpi_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_SURFACE),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 1), (-1, 1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 12),
    ]))
    elements.append(kpi_table)

    elements.append(Paragraph("Detailed Report", section_style))

    if data:
        data_table = _build_pdf_table(data, total_rev, total_count)
        elements.append(data_table)
    else:
        elements.append(Paragraph(
            "No data available for the selected filters.",
            ParagraphStyle('NoData', parent=styles['Normal'],
                           fontSize=11, textColor=COLOR_MUTED,
                           alignment=TA_CENTER, spaceBefore=20, spaceAfter=20)
        ))

    elements.append(Spacer(1, 24))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceAfter=8))

    footer_note_style = ParagraphStyle(
        'FooterNote', parent=styles['Normal'],
        fontSize=8, textColor=COLOR_MUTED, fontName='Helvetica-Oblique',
        alignment=TA_CENTER
    )
    elements.append(Paragraph(
        "This report is auto-generated by the SEROSOPS Business Operations Platform. "
        "For questions or corrections, contact your system administrator.",
        footer_note_style
    ))

    doc.build(elements, onFirstPage=_add_page_footer, onLaterPages=_add_page_footer)
    return buffer


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

    writer.writerow(["Period", "Revenue", "Transactions", "Avg per Transaction"])
    for row in data:
        rev = row.metrics.get("revenue", 0)
        cnt = row.metrics.get("count", 0)
        avg = rev / cnt if cnt else 0
        writer.writerow([row.date, f"{rev:.2f}", cnt, f"{avg:.2f}"])

    total_rev = summary.summary_metrics.get("total_revenue", 0)
    total_count = summary.total_records
    avg_total = total_rev / total_count if total_count else 0
    writer.writerow([])
    writer.writerow(["TOTAL", f"{total_rev:.2f}", total_count, f"{avg_total:.2f}"])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = (
        f"attachment; filename=report_{valid_vertical}_{timeframe}_{datetime.now().strftime('%Y%m%d')}.csv"
    )
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

    buffer = _build_pdf(valid_vertical, timeframe, data, summary, user)
    buffer.seek(0)

    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = (
        f"attachment; filename=report_{valid_vertical}_{timeframe}_{datetime.now().strftime('%Y%m%d')}.pdf"
    )
    return response
