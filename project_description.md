# SEROSOPS - Business Operations Dashboard

## Project Description

SEROSOPS is a full-stack web application built to centralize and streamline the operations of SEROS - a company running three distinct business verticals: **Equipment Rental**, **Piling Operations**, and **O&M (Operations and Maintenance) Services**. It replaces spreadsheets and manual tracking with a single, role-based platform where managers see only what matters to them, and the admin sees everything.

---

## Table of Contents

1. What Problem It Solves
2. Technology Stack
3. How It Works - High-Level Flow
4. User Roles and Permissions
5. Pages and Features - Screen by Screen
6. Data Ingestion - How Data Enters the System
7. Database Structure
8. API Architecture     
9. Security
10. How the Frontend and Backend Communicate
11. Deployment Notes

---

## 1. What Problem It Solves

Before SEROSOPS, operations data lived in scattered Excel files across departments. There was no single view of fleet utilization, no automated alerts for expiring insurance, no centralized tracking of which equipment was rented where, and no easy way to generate cross-vertical financial reports.

**SEROSOPS solves this by:**

- Giving each department manager (Rental, Piling, O&M) their own tailored dashboard with only the data relevant to their vertical
- Giving the Admin / Director a single screen that shows company-wide KPIs across all three verticals
- Automating alerts for expiring insurance, fitness certificates, contract renewals, overdue invoices, and missed preventive maintenance
- Providing bulk Excel upload so existing spreadsheets can be imported without manual data entry
- Enabling real-time reports with PDF and CSV export

---

## 2. Technology Stack

### Frontend (What the user sees)

| Technology | Purpose |
|---|---|
| **React 18** | UI framework - builds the interactive pages |
| **Vite** | Development server and build tool |
| **Tailwind CSS** | Styling - dark theme, responsive layout |
| **Recharts** | Charts and graphs (bar, line, pie, gauge) |
| **Zustand** | Lightweight state management (keeps user login state) |
| **Axios** | HTTP client - sends requests to the backend |
| **Lucide React** | Icon library |
| **jsPDF** | Client-side PDF report generation |
| **React Router** | Page navigation and URL routing |

### Backend (The server)

| Technology | Purpose |
|---|---|
| **FastAPI (Python)** | REST API framework - handles all requests |
| **SQLAlchemy** | Database ORM - maps Python code to SQL queries |
| **PostgreSQL (Supabase)** | Cloud-hosted database |
| **python-jose** | JWT token creation and verification |
| **passlib + bcrypt** | Password hashing (never stores plain passwords) |
| **openpyxl** | Excel file parsing for bulk data uploads |
| **ReportLab** | Server-side PDF generation |
| **Uvicorn** | ASGI server that runs the FastAPI app |

### Infrastructure

| Component | Details |
|---|---|
| **Database Hosting** | Supabase (PostgreSQL) on AWS, region: ap-southeast-2 |
| **Authentication** | JWT tokens (60-minute expiry) |
| **File Storage** | Supabase Storage bucket (seros-uploads) |

---

## 3. How It Works - High-Level Flow

```
User opens browser -> Frontend loads (React)
        |
Login screen -> POST /api/users/login
        |
Backend validates email/password -> returns JWT token
        |
Frontend stores token -> fetches role-specific dashboard data
        |
Each page calls its own API endpoint -> backend returns data -> frontend renders
        |
Charts, tables, cards update with live database data
```

The frontend never touches the database directly. Every piece of data goes through the API with the JWT token attached.

---

## 4. User Roles and Permissions

| Role | Username | Password | Access |
|---|---|---|---|
| **Admin** | admin@company.com | admin123 | All pages, admin analytics, user management, data upload |
| **Rental Manager** | rental@company.com | rental123 | Rental Dashboard, Alerts, Reports, Finance, Maintenance |
| **Piling Manager** | piling@company.com | piling123 | Piling Dashboard, Pile Logs, Daily Reports, Alerts, Reports, Finance, Maintenance |
| **OM Manager** | om@company.com | om123 | O&M Dashboard, Service Requests, Vendors, Alerts, Reports, Finance, Maintenance |

**What each role sees:**

- **Admin** sees all menu items. Can upload data files. Can see company-wide analytics.
- **Rental Manager** sees rental-focused dashboards. Equipment utilization, revenue, contract status.
- **Piling Manager** sees pile-driving operations. Daily progress logs, rig utilization, cost per pile.
- **OM Manager** sees service requests, vendor management, contract tracking.

The sidebar menu changes dynamically based on role. Admin sees 14+ menu items; a Rental Manager sees 10.

---

## 5. Pages and Features - Screen by Screen

### Login Page
- Dark themed login form with email and password fields
- Validates against database via `/api/users/login`
- On success, stores JWT token in localStorage and navigates to the appropriate dashboard based on role
- Admin goes to Admin Dashboard; others go to their vertical-specific dashboard

### Admin Dashboard (admin only)
- **Top KPI Cards:** Total Assets (count from equipment table), Active Rentals (from rentals table), Active Piling Projects (from piling_projects table), Total O&M Contracts (from service_contracts table)
- **Revenue Trend Chart:** Line chart showing monthly revenue across all verticals (fetched from `/admin-dashboard/charts/revenue-line`)
- **Equipment Utilization by Vertical:** Bar chart comparing rental vs piling vs O&M utilization percentages
- **Piling Project Status Distribution:** Pie chart showing how many piling projects are Completed vs In Progress vs Planning vs On Hold
- **Active Service Contracts List:** Table of O&M contracts with service type, monthly cost, SLA hours, and status
- **Alerts Preview:** Table of unresolved alerts across the system (insurance expiring, overdue invoices, missed maintenance)

### Rental Dashboard
- **KPI Cards:** Total Fleet Size, Utilization Rate (%), Monthly Revenue, Overdue Invoices
- **Revenue Trend Chart:** Bar chart showing monthly rental revenue
- **Top Rented Equipment List:** Shows most-rented equipment with total revenue
- **Contract Status Distribution:** Donut chart (Active, Overdue, Completed, Terminated)

### Piling Dashboard
- **KPI Cards:** Active Rigs (available equipment for piling), Piles Driven (count), Revenue, Efficiency (cost per pile)
- **Rig Utilization Chart:** Bar chart comparing utilization across piling rigs
- **Cost per Pile Trend:** Line chart showing cost efficiency over time
- **Average Piles per Day:** Gauge chart showing daily productivity
- **Project Status:** Breakdown of In Progress vs Completed vs Planning vs On Hold

### O&M Dashboard
- **KPI Cards:** Active Contracts, Service Requests (open/in-progress), Vendor Count, SLA Compliance (%)
- **Service Request Status:** Pie chart (Open, In Progress, Completed, Overdue)
- **Requests by Priority:** Bar chart (Critical, High, Medium, Low)
- **SLA Response Time Trend:** Line chart showing average response time per week
- **Top Vendors:** List of vendors with request count and completion rate

### Equipment Page (Rental / Piling)
- Table of all equipment with columns: Name, Equipment ID, Category, Status, Location
- Supports search and status filtering
- Status colors: Available (green), In Use (blue), Maintenance (amber), Out of Service (red)

### Rentals Page (Rental Manager)
- Table of all rental contracts with: Contract ID, Equipment, Customer, Start/End dates, Monthly Rate, Status, Payment Status
- Search and status filter

### Contracts Page (O&M Manager)
- Table of service contracts with: Contract ID, Customer, Contract Type, Service Type, Monthly Cost, SLA Hours, Status

### Pile Logs Page (Piling Manager)
- Table of pile-driving logs with: Date, Project, Pile Type, Depth, Crew Size, Equipment Used

### Service Requests Page (O&M Manager)
- Table with: ID, Description, Customer, Priority, Status, Vendor, Created/Completed dates
- Priority shown as color-coded badges

### Vendors Page (O&M Manager)
- Table with: Name, Contact Person, Phone, Email, Service Types, Status, Rating, Completed Requests

### Finance Page (All roles)
- **Cost Breakdown by Category:** Pie chart showing spending by category (Fuel, Parts, Labor, Maintenance, Other)
- **Revenue vs Cost by Month:** Stacked bar chart (net revenue per month)
- **Invoice Status:** Pie chart (Paid, Pending, Overdue)
- **Top Cost Items:** Horizontal bar chart of highest individual expenses
- Table showing recent transactions

### Maintenance Page (All roles)
- **Overall Status Breakdown:** Pie chart (Due Soon, Overdue, Completed)
- **Overdue Items List:** Table of maintenance tasks past their due date
- **Upcoming/Completed Items:** Separate tables with preventive maintenance schedules
- **SLA Response Trend:** Line chart

### Reports Page (All roles)
- **Revenue Breakdown by Vertical:** Pie chart showing each vertical's share of revenue
- **Monthly Revenue Trend:** Line chart comparing all three verticals over time
- **Contract Status Summary:** Pie chart of active vs completed vs terminated contracts
- **Export Options:** PDF (generates server-side) and CSV (generates client-side)

### Alerts Page (All roles)
- Table of all alerts with: Severity, Alert Type, Message, Equipment/Contract/Project, Created date
- **Severity filter:** Low, Medium, High, Critical - each with color-coded badges
- Alert types include: Insurance Expiring, Fitness Expiring, Contract Renewal, Overdue Invoice, Overdue Maintenance, Maintenance Due Soon, High Failure Rate

### Data Upload Page (Admin only)
- File input accepting `.xlsx`, `.xls`, `.csv` files
- Supports 8 sheet names: Equipment, Customers, Rental_Contracts, Piling_Projects, Pile_Logs, Service_Contracts, Service_Requests, Vendors
- Each sheet maps columns to database tables with type conversion
- Returns success/error counts after upload

### Settings / Profile Page
- Shows current user info (name, email, role, department)
- Change password functionality (requires current password)
- Quick navigation to other pages via action cards

---

## 6. Data Ingestion - How Data Enters the System

### Option A: Bulk Excel Upload (Admin only)

Navigate to **Data Upload** from the sidebar (Admin only). Upload an Excel file with one or more of these sheet names:

| Sheet Name | Maps To |
|---|---|
| Equipment | `equipment` table |
| Customers | `customers` table |
| Rental_Contracts | `rental_contracts` table |
| Piling_Projects | `piling_projects` table |
| Pile_Logs | `pile_logs` table |
| Service_Contracts | `service_contracts` table |
| Service_Requests | `service_requests` table |
| Vendors | `vendors` table |

The backend uses `openpyxl` to parse the Excel file, reads headers from the first row, maps column names to database fields, performs type conversion (strings to dates, strings to decimals, etc.), and bulk-inserts the rows. Duplicate detection prevents re-adding existing records.

### Option B: SQL Seed Scripts

The `scripts/` directory contains `seed_data.sql` and `seed_data_enhanced.sql` files with INSERT statements for populating the database with sample data across all 14 tables plus triggers and views.

### Option C: Programmatic Insertion via API

All POST endpoints accept JSON payloads for creating individual records (e.g., POST `/equipment/` to add one piece of equipment).

---

## 7. Database Structure

The database contains 14 core tables:

| Table | Purpose | Key Relationships |
|---|---|---|
| **users** | Login credentials and role assignments | Referenced by all audit fields |
| **equipment** | All company assets (rigs, generators, pumps, etc.) | Referenced by rental_contracts, pile_logs, purchase_orders |
| **customers** | Client companies and contacts | Referenced by rental_contracts, service_contracts |
| **rental_contracts** | Equipment rental agreements | Links to equipment and customers |
| **piling_projects** | Piling operation projects | Links to customers, has pile_logs |
| **pile_logs** | Individual pile-driving records within a project | Links to piling_projects |
| **service_contracts** | O&M service agreements | Links to customers |
| **service_requests** | Work orders / service tickets | Links to service_contracts, vendors |
| **vendors** | Third-party service providers | Referenced by service_requests |
| **maintenance_records** | Preventive and corrective maintenance logs | Links to equipment |
| **invoices** | Billing records for all verticals | Links to contracts, rentals |
| **cost_entries** | Expense tracking (fuel, parts, labor) | Links to equipment or contracts |
| **alerts** | System-generated notifications | References any entity type |
| **audit_logs** | Change tracking for compliance | Records all create/update/delete operations |

Additional views and triggers handle automatic alert generation (e.g., creating an alert when insurance expiry date is within 30 days).

---

## 8. API Architecture

All API endpoints are prefixed with `/api/`. The backend exposes 24+ endpoints grouped by domain:

| Prefix | Module | Example Endpoints |
|---|---|---|
| `/api/users/` | Authentication & User Management | POST `/login`, GET `/me`, PUT `/me/password`, GET `/` (admin), POST `/` (admin) |
| `/api/equipment/` | Fleet Management | GET `/`, GET `/{id}`, POST `/`, PUT `/{id}` |
| `/api/customers/` | Customer Management | GET `/`, POST `/`, PUT `/{id}` |
| `/api/rentals/` | Rental Contracts | GET `/`, POST `/`, PUT `/{id}` |
| `/api/piling/` | Piling Operations | GET `/projects/`, POST `/projects/`, GET `/pile-logs/`, POST `/pile-logs/` |
| `/api/service-contracts/` | O&M Contracts | GET `/`, POST `/`, PUT `/{id}` |
| `/api/service-requests/` | O&M Work Orders | GET `/`, POST `/`, PUT `/{id}` |
| `/api/vendors/` | Vendor Management | GET `/`, POST `/`, PUT `/{id}` |
| `/api/maintenance/` | Maintenance Scheduling | GET `/`, POST `/`, PUT `/{id}` |
| `/api/finance/` | Financial Data | GET `/costs/`, POST `/costs/`, GET `/invoices/` |
| `/api/alerts/` | Alert Management | GET `/`, PUT `/{id}/resolve` |
| `/api/admin-dashboard/` | Admin KPIs & Charts | GET `/kpi`, GET `/charts/revenue-line`, GET `/charts/utilization`, GET `/charts/piling-status`, GET `/contracts`, GET `/alerts` |
| `/api/reports/` | Report Generation | GET `/revenue-by-vertical`, GET `/monthly-trend`, GET `/contracts-summary`, GET `/generate-pdf` |
| `/api/data-upload/` | Bulk Data Import | POST `/upload-excel` |
| `/api/audit/` | Audit Log Viewing | GET `/` |

### Endpoint Behavior

- **GET** endpoints return lists of records or aggregated data
- **POST** endpoints create new records (accept JSON body)
- **PUT** endpoints update existing records by ID
- **DELETE** endpoints remove records by ID (soft-delete where applicable)

Dashboard-specific endpoints return pre-aggregated KPI data and chart-ready datasets, so the frontend doesn't need to compute metrics client-side.

---

## 9. Security

### Authentication
- Passwords are hashed using **bcrypt** via passlib before storage
- On login, the backend verifies the hash and returns a **JWT token** containing the user's ID, email, and role
- Tokens expire after **60 minutes**
- All API requests (except login) require the `Authorization: Bearer <token>` header

### Authorization
- Role-based access control enforced both in the backend (decorator functions on protected routes) and frontend (sidebar menu filtering)
- Admin endpoints check for `role == "admin"` before allowing access
- Each vertical's dashboard endpoints check for the matching role

### Database Security
- Database credentials stored in `.env` file (never committed to source control)
- Supabase provides SSL-encrypted connections
- Row-level security policies can be configured at the Supabase level

### Frontend Security
- JWT token stored in `localStorage`
- Axios interceptor automatically attaches the token to every request
- Expired tokens trigger automatic logout and redirect to login page
- A flag (`isRedirecting`) prevents multiple simultaneous redirects

---

## 10. How the Frontend and Backend Communicate

### Development Mode

```
Browser (localhost:5173)
    |
    | Request to /api/users/login
    |
Vite Dev Server (localhost:5173)
    |
    | Proxies /api/* to localhost:8000 (strips /api prefix)
    |
FastAPI Backend (localhost:8000)
    |
    | Handles /users/login
    |
PostgreSQL (Supabase)
```

The Vite config (`vite.config.js`) sets up a proxy rule: any request starting with `/api/` gets forwarded to `http://localhost:8000/` with the `/api` prefix stripped. So a frontend call to `POST /api/users/login` actually hits `POST http://localhost:8000/users/login` on the backend.

### Production Mode

The `npm run build` command produces static files (HTML, CSS, JS) in `frontend/dist/`. These can be served by any static file server (Nginx, Apache, or a CDN). The backend runs as a separate service. The frontend's Axios base URL is set to `/api` which must be routed to the backend server by the web server configuration.

### Request Lifecycle

1. Frontend component mounts (e.g., `RentalDashboard`)
2. `useEffect` fires, calling an API function from `src/api/rentalApi.js`
3. The API function calls `axios.get('/api/rentals/')` (or similar)
4. The Vite proxy forwards to `http://localhost:8000/rentals/`
5. Backend handler queries the database via SQLAlchemy
6. Backend returns JSON response
7. Frontend stores data in React state (`useState`)
8. Component re-renders with the data, populating charts and tables

If the API call fails (network error, 401, 500), the component falls back to mock data so the UI never shows a blank screen.

---

## 11. Deployment Notes

### Running Locally

```bash
# Backend
cd backend
pip install -r ../requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd frontend
npm run build   # Produces optimized static files in frontend/dist/
```

### Environment Variables (.env)

```
DATABASE_URL=postgresql://...           # Supabase PostgreSQL connection string
SECRET_KEY=<random-64-char-string>      # Used to sign JWT tokens
SUPABASE_URL=https://xxxx.supabase.co   # Supabase project URL
SUPABASE_KEY=<supabase-anon-key>        # Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY=<key>         # Supabase service role key (admin operations)
JWT_ALGORITHM=HS256                     # JWT signing algorithm
JWT_EXPIRATION_MINUTES=60               # Token lifetime in minutes
```

### Key Directories

```
dboard_vscode/
  backend/
    app/
      main.py              # FastAPI entry point, all router registrations
      api/                  # All API route handlers (users, equipment, rentals, etc.)
      models/               # SQLAlchemy ORM models (one file per table)
      schemas/              # Pydantic request/response schemas
      auth/                 # JWT token creation and verification utilities
    scripts/                # SQL seed data scripts
    requirements.txt        # Python dependencies
  frontend/
    src/
      pages/                # All page components (admin/, rental/, piling/, om/, finance/, etc.)
      components/           # Reusable UI components (layout/, charts/, ui/)
      api/                  # API client modules (one per domain)
      lib/                  # Axios instance configuration and auth helpers
      store/                # Zustand stores (authStore for login state)
      App.jsx               # Route definitions and page mapping
      main.jsx              # React entry point
    vite.config.js          # Vite config with API proxy rules
    package.json            # Frontend dependencies
```

---

*SEROSOPS - Built for SEROS Operations. Replacing spreadsheets with a single source of truth.*
