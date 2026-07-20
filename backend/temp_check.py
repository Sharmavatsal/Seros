from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    r = db.execute(text("SELECT count(*) FROM piling_daily_logs"))
    print(f"piling_daily_logs rows: {r.scalar()}")
except Exception as e:
    print(f"Error: {e}")
db.close()
