from fastapi import FastAPI
from app.api.assets import router as asset_router
from app.api.test_data import router as test_router
from app.api.auth import router as auth_router
from app.api.rental_dashboard import router as rental_dashboard_router
from app.api.rental_contracts import router as rental_contract_router 
from app.api.rental_daily_logs import router as rental_daily_log_router
from app.api.rental_dashboard import router as rental_dashboard_router
from app.api.rental_alerts import router as rental_alerts_router
from app.api.rental_reports import router as rental_reports_router
from app.api.piling_logs import router as piling_logs_router
from app.api.piling_dashboard import router as piling_dashboard_router
from app.api.om_tickets import router as om_tickets_router
from app.api.om_dashboard import router as om_dashboard_router
from app.api.finance import router as finance_router
from app.api.maintenance import router as maintenance_router
app = FastAPI(
    title="Business Dashboard API"
)
app.include_router(asset_router)
app.include_router(test_router)
app.include_router(auth_router)
app.include_router(rental_contract_router)
app.include_router(rental_daily_log_router)
app.include_router(rental_dashboard_router)
app.include_router(rental_alerts_router)
app.include_router(rental_reports_router)
app.include_router(piling_logs_router)
app.include_router(piling_dashboard_router)
app.include_router(om_tickets_router)
app.include_router(om_dashboard_router)
app.include_router(finance_router)
app.include_router(maintenance_router)
@app.get("/")
def root():
    return {
        "status": "running"
    }