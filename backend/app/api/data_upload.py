from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import io
import openpyxl

from app.core.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.user import User
from app.models.vendor import Vendor
from app.models.asset import Asset
from app.models.client import Client
from app.models.project import Project
from app.models.upload_history import UploadHistory
from app.schemas.upload_history import UploadHistoryResponse

router = APIRouter(prefix="/data-upload", tags=["Data Upload"])


def parse_excel(file_bytes: bytes) -> list[dict]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return [], []
    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(rows[0])]
    data = []
    for row in rows[1:]:
        if all(c is None for c in row):
            continue
        record = {}
        for i, val in enumerate(row):
            if i < len(headers):
                record[headers[i]] = val
        data.append(record)
    return headers, data


def save_upload_history(db, file_type, file_name, user_id, row_count, rows_updated, status, errors):
    """Save upload history. Graceful if table doesn't exist yet."""
    try:
        history = UploadHistory(
            file_type=file_type, file_name=file_name, uploaded_by=user_id,
            row_count=row_count, rows_updated=rows_updated, status=status,
            error_message="; ".join(errors[:20]) if errors else None,
        )
        db.add(history)
        db.commit()
    except Exception:
        db.rollback()


@router.post("/vendors")
async def upload_vendors(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx files accepted")

    content = await file.read()
    headers, data = parse_excel(content)

    inserted, updated, errors = 0, 0, []
    for i, row in enumerate(data, 1):
        try:
            vendor_code = str(row.get("Vendor Code", row.get("vendor_code", ""))).strip()
            if not vendor_code:
                errors.append(f"Row {i}: Missing Vendor Code")
                continue

            vendor_name = str(row.get("Vendor Name", row.get("vendor_name", "")) or "")
            service_type = str(row.get("Services", row.get("services", row.get("service_type", "")))) or ""
            remarks = str(row.get("Description", row.get("description", row.get("remarks", "")))) or ""
            contact_person = str(row.get("Contact Person", row.get("contact_person", ""))) or ""
            contact_number = str(row.get("Contact Number", row.get("contact_number", row.get("WO/PO", "")))) or ""
            email_val = str(row.get("Email", row.get("email", ""))) or ""

            existing = db.query(Vendor).filter(Vendor.vendor_code == vendor_code).first()
            if existing:
                existing.vendor_name = vendor_name or existing.vendor_name
                existing.service_type = service_type or existing.service_type
                existing.remarks = remarks or existing.remarks
                existing.contact_person = contact_person or existing.contact_person
                existing.contact_number = contact_number or existing.contact_number
                if email_val:
                    existing.email = email_val
                updated += 1
            else:
                v = Vendor(
                    vendor_code=vendor_code,
                    vendor_name=vendor_name,
                    service_type=service_type,
                    remarks=remarks,
                    contact_person=contact_person,
                    contact_number=contact_number,
                    email=email_val,
                )
                db.add(v)
                inserted += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    save_upload_history(db, "vendor", file.filename, user.id, inserted, updated,
        "Success" if not errors else ("Partial" if inserted + updated > 0 else "Failed"), errors)

    return {
        "status": "success" if not errors else "partial",
        "rows_inserted": inserted,
        "rows_updated": updated,
        "errors": errors[:50],
        "total_rows": len(data),
    }


@router.post("/equipment")
async def upload_equipment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx files accepted")

    content = await file.read()
    headers, data = parse_excel(content)

    inserted, updated, errors = 0, 0, []
    for i, row in enumerate(data, 1):
        try:
            reg_no = str(row.get("Registration No", row.get("registration_no", ""))).strip()
            if not reg_no:
                errors.append(f"Row {i}: Missing Registration No")
                continue

            status_val = str(row.get("Status", row.get("status", "Available")) or "Available")
            service_type = str(row.get("service_type", row.get("Service Type", "rental")) or "rental").lower()

            existing = db.query(Asset).filter(Asset.registration_no == reg_no).first()
            if existing:
                existing.category = row.get("Category", row.get("category", existing.category)) or existing.category
                existing.equipment_type = row.get("Equipment Type", row.get("equipment_type", existing.equipment_type)) or existing.equipment_type
                existing.make = row.get("Make", row.get("make", existing.make)) or existing.make
                existing.model = row.get("Model", row.get("model", existing.model)) or existing.model
                existing.capacity = str(row.get("Capacity", row.get("capacity", existing.capacity)) or existing.capacity)
                existing.status = status_val
                existing.location = row.get("Location", row.get("location", existing.location)) or existing.location
                existing.service_type = service_type
                if row.get("Monthly Rental") or row.get("monthly_rental"):
                    existing.monthly_rental = float(row.get("Monthly Rental") or row.get("monthly_rental") or 0)
                updated += 1
            else:
                yom = row.get("YOM", row.get("year_of_manufacture"))
                a = Asset(
                    registration_no=reg_no,
                    category=str(row.get("Category", row.get("category", "")) or ""),
                    equipment_type=str(row.get("Equipment Type", row.get("equipment_type", "")) or ""),
                    make=str(row.get("Make", row.get("make", "")) or ""),
                    model=str(row.get("Model", row.get("model", "")) or ""),
                    capacity=str(row.get("Capacity", row.get("capacity", "")) or ""),
                    year_of_manufacture=int(yom) if yom else None,
                    status=status_val,
                    monthly_rental=float(row.get("Monthly Rental", row.get("monthly_rental", 0)) or 0),
                    location=str(row.get("Location", row.get("location", "")) or ""),
                    service_type=service_type,
                )
                db.add(a)
                inserted += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    save_upload_history(db, "equipment", file.filename, user.id, inserted, updated,
        "Success" if not errors else ("Partial" if inserted + updated > 0 else "Failed"), errors)

    return {
        "status": "success" if not errors else "partial",
        "rows_inserted": inserted,
        "rows_updated": updated,
        "errors": errors[:50],
        "total_rows": len(data),
    }


@router.post("/orders")
async def upload_orders(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx files accepted")

    content = await file.read()
    headers, data = parse_excel(content)

    orders_inserted, clients_inserted, errors = 0, 0, []
    for i, row in enumerate(data, 1):
        try:
            po_no = str(row.get("PO/WO Number", row.get("po_wo_number", ""))).strip()
            customer = str(row.get("Customer Name", row.get("client_name", ""))).strip()

            if not po_no:
                errors.append(f"Row {i}: Missing PO/WO Number")
                continue

            client_id = None
            if customer:
                existing_client = db.query(Client).filter(Client.customer_name == customer).first()
                if not existing_client:
                    new_client = Client(customer_name=customer)
                    db.add(new_client)
                    db.flush()
                    clients_inserted += 1
                    client_id = new_client.id
                else:
                    client_id = existing_client.id

            service_type = str(row.get("service_type", row.get("Service Type", "rental")) or "rental").lower()
            status = str(row.get("Status", "Active") or "Active")

            existing_order = db.query(Project).filter(Project.po_wo_number == po_no).first()
            if existing_order:
                existing_order.status = status
                existing_order.service_type = service_type
                if client_id:
                    existing_order.client_id = client_id
                if row.get("Monthly Billing Actual"):
                    existing_order.monthly_billing_actual = float(row["Monthly Billing Actual"])
                if row.get("Monthly Billing Potential"):
                    existing_order.monthly_billing_potential = float(row["Monthly Billing Potential"])
            else:
                def parse_date(val):
                    if val is None:
                        return None
                    if isinstance(val, datetime):
                        return val.date()
                    if isinstance(val, str):
                        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"]:
                            try:
                                return datetime.strptime(val, fmt).date()
                            except ValueError:
                                continue
                    return None

                p = Project(
                    po_wo_number=po_no,
                    client_id=client_id,
                    location=str(row.get("Location", "")) or None,
                    job_description=str(row.get("Job Description", "")) or None,
                    quantity=int(row.get("Qty", 0) or 0),
                    start_date=parse_date(row.get("Start Date")),
                    end_date=parse_date(row.get("End Date")),
                    monthly_billing_potential=float(row.get("Monthly Billing Potential", 0) or 0),
                    monthly_billing_actual=float(row.get("Monthly Billing Actual", 0) or 0),
                    status=status,
                    service_type=service_type,
                )
                db.add(p)
                orders_inserted += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    save_upload_history(db, "order", file.filename, user.id, orders_inserted, clients_inserted,
        "Success" if not errors else ("Partial" if orders_inserted > 0 else "Failed"), errors)

    return {
        "status": "success" if not errors else "partial",
        "orders_inserted": orders_inserted,
        "clients_inserted": clients_inserted,
        "errors": errors[:50],
        "total_rows": len(data),
    }


@router.post("/pre-rental")
async def upload_pre_rental(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    from app.models.pre_rental_inspection import PreRentalInspection

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx files accepted")

    content = await file.read()
    headers, data = parse_excel(content)

    inserted, errors = 0, []
    for i, row in enumerate(data, 1):
        try:
            def parse_date(val):
                if val is None:
                    return None
                if isinstance(val, datetime):
                    return val.date()
                if isinstance(val, str):
                    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"]:
                        try:
                            return datetime.strptime(val, fmt).date()
                        except ValueError:
                            continue
                return None

            insp = PreRentalInspection(
                inspection_date=parse_date(row.get("Inspection Date", row.get("inspection_date"))) or datetime.now().date(),
                duration_days=int(row.get("Duration Days", row.get("duration_days", 0)) or 0),
                rental_rate=float(row.get("Rental Rate", row.get("rental_rate", 0)) or 0),
                inspection_status=str(row.get("Status", row.get("inspection_status", "Pending")) or "Pending"),
                checklist_equipment_condition=str(row.get("Equipment Condition", "") or ""),
                checklist_functionality=str(row.get("Functionality", "") or ""),
                checklist_safety=str(row.get("Safety", "") or ""),
                inspection_notes=str(row.get("Notes", row.get("inspection_notes", "")) or ""),
            )
            db.add(insp)
            inserted += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    save_upload_history(db, "inspection", file.filename, user.id, inserted, 0,
        "Success" if not errors else ("Partial" if inserted > 0 else "Failed"), errors)

    return {
        "status": "success" if not errors else "partial",
        "rows_inserted": inserted,
        "errors": errors[:50],
        "total_rows": len(data),
    }


@router.get("/history", response_model=list[UploadHistoryResponse])
def get_upload_history(
    file_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    q = db.query(UploadHistory).order_by(UploadHistory.uploaded_at.desc())
    if file_type:
        q = q.filter(UploadHistory.file_type == file_type)
    return q.limit(limit).all()
