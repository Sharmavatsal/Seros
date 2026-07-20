from app.core.database import engine, Base
from app.models.user import User
from app.models.vendor import Vendor
from app.models.client import Client
from app.models.asset import Asset
from app.models.project import Project
from app.models.piling_daily_log import PilingDailyLog
from app.models.rental_daily_log import RentalDailyLog
from app.models.rental_contract import RentalContract
from app.models.om_ticket import OMTicket
from app.models.maintenance import MaintenanceSchedule, MaintenanceLog
from app.models.finance import Invoice, Expense
from app.models.document import Document

print("Creating all missing tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
