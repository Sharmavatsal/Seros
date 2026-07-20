from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(
        text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    )
    tables = [r[0] for r in result]
    print('Tables in database:')
    for t in tables:
        print(f'  - {t}')
