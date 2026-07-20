from sqlalchemy import text
from app.core.database import engine

with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'om_tickets' ORDER BY ordinal_position"))
    print("=== om_tickets columns in DB ===")
    for row in result:
        print(f"  {row[0]:25s} {row[1]:30s} nullable={row[2]}")

    print()
    print("=== om_tickets rows ===")
    result2 = conn.execute(text("SELECT * FROM om_tickets"))
    for row in result2:
        print(row._mapping)
