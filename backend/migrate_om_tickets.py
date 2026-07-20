from sqlalchemy import text
from app.core.database import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE om_tickets ALTER COLUMN asset_id DROP NOT NULL"))
    conn.commit()
    print("asset_id is now nullable")
