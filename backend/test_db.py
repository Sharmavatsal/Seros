from app.core.database import engine

try:
    conn = engine.connect()
    print("DATABASE CONNECTED SUCCESSFULLY")
    conn.close()

except Exception as e:
    print("DATABASE CONNECTION FAILED")
    print(e)
from app.core.database import DATABASE_URL

print("DATABASE_URL FROM APP:")
print(DATABASE_URL)