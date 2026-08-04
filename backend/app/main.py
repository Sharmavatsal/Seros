from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.assets import router as asset_router
from app.api.test_data import router as test_router
from app.api.auth import router as auth_router
from app.api.rental_dashboard import router as rental_dashboard_router
from app.api.rental_contracts import router as rental_contract_router 
from app.api.rental_daily_logs import router as rental_daily_log_router
from app.api.rental_reports import router as rental_reports_router
from app.api.piling_logs import router as piling_logs_router
from app.api.piling_dashboard import router as piling_dashboard_router
from app.api.om_tickets import router as om_tickets_router
from app.api.om_dashboard import router as om_dashboard_router
from app.api.finance import router as finance_router
from app.api.maintenance import router as maintenance_router
from app.api.admin_dashboard import router as admin_dashboard_router
from app.api.reports import router as reports_router
from app.api.alerts import router as alerts_router
from app.api.uploads import router as uploads_router
from app.api.users import router as users_router
from app.api.data_upload import router as data_upload_router
from app.api.equipment import router as equipment_router
from app.api.orders import router as orders_router
from app.api.inspections import router as inspections_router
app = FastAPI(
    title="Business Dashboard API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(asset_router, prefix="/api")
app.include_router(test_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(rental_contract_router, prefix="/api")
app.include_router(rental_daily_log_router, prefix="/api")
app.include_router(rental_dashboard_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(rental_reports_router, prefix="/api")
app.include_router(piling_logs_router, prefix="/api")
app.include_router(piling_dashboard_router, prefix="/api")
app.include_router(om_tickets_router, prefix="/api")
app.include_router(om_dashboard_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(admin_dashboard_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(data_upload_router, prefix="/api")
app.include_router(equipment_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(inspections_router, prefix="/api")

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

