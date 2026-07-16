from sqlalchemy import Column, String, Date, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base

class PilingDailyLog(Base):

    __tablename__ = "piling_daily_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    project_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    log_date = Column(Date, nullable=False)

    bores_completed = Column(Numeric, default=0)

    depth_achieved = Column(Numeric, default=0)

    cost_incurred = Column(Numeric, default=0)

    delay_days = Column(Numeric, default=0)

    rig_id = Column(
        UUID(as_uuid=True)
    )

    remarks = Column(String)
