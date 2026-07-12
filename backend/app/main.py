from fastapi import FastAPI
from app.api.assets import router as asset_router
from app.api.test_data import router as test_router
from app.api.auth import router as auth_router
from app.api.rental_dashboard import router as rental_dashboard_router
from app.api.rental_contracts import router as rental_contract_router 



app = FastAPI(
    title="Business Dashboard API"
)
app.include_router(asset_router)
app.include_router(test_router)
app.include_router(auth_router)
app.include_router(rental_contract_router)

@app.get("/")
def root():
    return {
        "status": "running"
    }