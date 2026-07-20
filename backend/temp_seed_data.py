from app.core.database import SessionLocal
from app.models.piling_daily_log import PilingDailyLog
from datetime import date, timedelta
import uuid, random

project_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
rig_id = uuid.UUID("00000000-0000-0000-0000-000000000002")

db = SessionLocal()

existing = db.query(PilingDailyLog).count()
if existing > 0:
    print(f"Already has {existing} rows, skipping seed")
else:
    for i in range(30):
        d = date.today() - timedelta(days=30 - i)
        log = PilingDailyLog(
            id=uuid.uuid4(),
            project_id=project_id,
            log_date=d,
            bores_completed=random.randint(10, 20),
            depth_achieved=random.randint(200, 500),
            cost_incurred=random.randint(8000, 15000),
            delay_days=random.randint(0, 2),
            rig_id=rig_id,
            remarks=f"Auto seed day {i+1}"
        )
        db.add(log)
    db.commit()
    print(f"Seeded 30 rows into piling_daily_logs")

db.close()
