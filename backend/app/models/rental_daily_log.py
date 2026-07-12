from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Date
from sqlalchemy import Numeric
from sqlalchemy import Boolean
from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.core.database import Base


class RentalDailyLog(Base):

    __tablename__ = "rental_daily_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    asset_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    log_date = Column(Date)

    working_hours = Column(
        Numeric,
        default=0
    )

    fuel_consumed = Column(
        Numeric,
        default=0
    )

    revenue_generated = Column(
        Numeric,
        default=0
    )

    breakdown = Column(
        Boolean,
        default=False
    )

    remarks = Column(String)