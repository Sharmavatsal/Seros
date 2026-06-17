from fastapi import FastAPI # type: ignore
from app.api.test_data import router as test_router

app = FastAPI(
    title="Business Dashboard API"
)

app.include_router(test_router)

@app.get("/")
def root():
    return {"status": "running"}