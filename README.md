# SEROSOPS - Business Operations Dashboard

A production-ready, multi-vertical business operations platform built with **FastAPI** (backend) and **React** (frontend). Designed for companies operating in **Equipment Rental**, **Piling Operations**, and **O&M Services**.

## Features

- **Role-Based Access Control (RBAC)** - Admin, Rental Manager, Piling Manager, O&M Manager
- **Equipment Rental Module** - Contracts, daily logs, utilization tracking, revenue reports
- **Piling Operations Module** - Daily logs, bore tracking, cost analysis
- **O&M Services Module** - Ticket management, SLA tracking, preventive maintenance
- **Finance Module** - Invoices, expenses, receivables tracking
- **Maintenance Module** - Schedules, logs, preventive maintenance tracking
- **Admin Dashboard** - Company-wide KPIs, charts, user management
- **Reports Engine** - PDF/CSV export with date range filtering
- **Alerts System** - Equipment expiry, contract expiry, SLA breaches, overdue invoices
- **File Uploads** - Supabase Storage integration for documents

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL (Supabase) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.10 |
| State | Zustand 4.4 |
| Auth | JWT (python-jose) + bcrypt |
| Storage | Supabase Storage |

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Sharmavatsal/Seros.git
cd Seros
```

### 2. Create `.env` file in the root directory

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000 ---- or ---- uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
-- to make a temp url for hosting the website in cloudflared run -> cloudflared tunnel --url http://localhost:5173/

Backend will start at `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start at `http://localhost:5173`

## Default Test Users

| Email | Password | Role |
|-------|----------|------|
| admin | admin123 | admin |
| rental | rental123 | rental_manager |
| piling | piling123 | piling_manager |
| om | om123 | om_manager |

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password

### Assets
- `GET /assets/` - List all assets
- `POST /assets/` - Create new asset

### Rental Module
- `GET/POST /rental-contracts/` - Manage rental contracts
- `GET/POST /rental-daily-logs/` - Manage daily logs
- `GET /rental-dashboard/summary` - Dashboard KPIs
- `GET /rental-reports/daily` - Daily reports
- `GET /rental-reports/monthly` - Monthly reports

### Piling Module
- `GET/POST /piling-logs/` - Manage piling logs
- `GET /piling-dashboard/summary` - Dashboard KPIs

### O&M Module
- `GET/POST /om-tickets/` - Manage service tickets
- `GET /om-dashboard/summary` - Dashboard KPIs

### Finance Module
- `GET/POST /finance/invoices` - Manage invoices
- `GET/POST /finance/expenses` - Manage expenses
- `GET /finance/dashboard` - Finance summary

### Maintenance Module
- `GET/POST /maintenance/schedules` - Maintenance schedules
- `GET/POST /maintenance/logs` - Maintenance logs

### Admin Dashboard
- `GET /admin-dashboard/summary` - Company-wide KPIs
- `GET /admin-dashboard/charts/revenue-line` - Revenue trend
- `GET /admin-dashboard/charts/revenue-pie` - Revenue breakdown
- `GET /admin-dashboard/users` - List users

### Reports
- `GET /reports/data` - Aggregated report data
- `GET /reports/export/csv` - Download CSV
- `GET /reports/export/pdf` - Download PDF

### Alerts
- `GET /alerts/` - Unified alerts

### File Uploads
- `POST /uploads/` - Upload file
- `GET /uploads/{entity_type}/{entity_id}` - Get documents

## Project Structure

```
dboard_vscode/
├── backend/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   ├── auth/          # Authentication & RBAC
│   │   ├── core/          # Database config
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── main.py        # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Axios config
│   │   ├── pages/         # Dashboard pages
│   │   └── store/         # Zustand state
│   └── package.json
└── .env                   # Environment variables
```

## Database Tables

- `users` - User accounts with roles
- `assets_master` - Equipment/asset registry
- `rental_contracts` - Rental agreements
- `rental_daily_logs` - Daily operation logs
- `piling_daily_logs` - Piling operation logs
- `om_tickets` - Service tickets
- `invoices` - Financial invoices
- `expenses` - Financial expenses
- `maintenance_schedules` - PM schedules
- `maintenance_logs` - Maintenance records
- `projects` - Business projects
- `clients` - Client records
- `vendors` - Vendor records
- `documents` - File upload metadata

## Contributors

- [Vatsal Sharma](https://github.com/Sharmavatsal) - Full-stack development, backend & frontend
- [Vyom Modh](https://github.com/DarkHeaVen1711) - Backend APIs, database models, deployment

## License

Private - For internal use only.



