# Integrated Business Operations Dashboard – Project Handoff Prompt

*Copy and paste the entire content below this line into Cursor, Antigravity, or your preferred AI tool to continue the project.*

***

## Project Overview
Build a production-ready multi-vertical business operations platform for a company operating in:
1. Equipment Rental
2. Piling Operations
3. O&M (Operations & Maintenance) Services

The system must provide role-based access, operational tracking, KPI dashboards, reports, finance tracking, maintenance monitoring, alerts, and documentation management.

---

## Tech Stack
**Backend:** Python FastAPI, SQLAlchemy, PostgreSQL (Supabase), JWT Authentication, Role Based Access Control (RBAC)
**Frontend:** React (Vite), Tailwind CSS, Recharts
**Database:** PostgreSQL via Supabase
**Storage:** Supabase Storage for image uploads and project documentation
**Authentication:** JWT Tokens, Protected APIs, Role-based route access
**Environment Variables:** DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

---

## Roles & Permissions
**Admin:** Full access to all modules. Can view all business verticals, company-wide revenue, finance across all verticals, manage users, view combined reports, receivables, invoices, expenses, and cross-vertical comparisons.

**Rental Manager:** Access only Equipment Rental module. Can view Rental KPIs, revenue, reports, charts. Cannot view Piling data, O&M data, or other vertical financials.

**Piling Manager:** Access only Piling Operations module. Can view Piling KPIs, revenue, reports. Cannot view Rental data, O&M data, or other vertical financials.

**OM Manager:** Access only O&M module. Can view O&M KPIs, revenue, reports. Cannot view Rental data, Piling data, or other vertical financials.

**Critical Business Rule:** Managers should be able to see sales and finance metrics of their own vertical only. Admin can see everything. This vertical isolation is currently enforced via specialized FastAPI dependencies (`get_rental_access`, `get_piling_access`, `get_om_access`).

---

## UI Requirements
**Theme:** Dark Mode
**Design:** Industrial, Professional, Corporate Dashboard
**Navigation:** Sidebar
**Responsive:** Desktop, Tablet
**Colors:** Green = Active / Healthy, Yellow = Warning, Red = Alert / Breakdown
**UX:** Loading skeletons, Toast notifications, Form validation
**Charts:** Recharts only

---

## Dashboard Requirements
**Admin Dashboard:**
- KPIs: Total Revenue, Equipment Utilization %, Active Projects, Outstanding Receivables
- Charts: Revenue Line Chart (Daily/Monthly/Yearly), Revenue Pie Chart (Rental/Piling/O&M), Top 10 Client Profitability, Receivables Aging Chart
- Tables: User Management

**Rental Manager Dashboard:**
- KPIs: Equipment Utilization %, Active Contracts, Monthly Rental Revenue, Fuel Consumption
- Charts: Monthly Rental Revenue, Fuel Consumption Trend, Breakdown Trend
- Tables: Equipment Availability
- Alerts: Insurance expiry, Fitness expiry, Low utilization, Breakdown alerts

**Piling Manager Dashboard:**
- KPIs: Piles Per Day, Cost Per Pile, Rig Utilization %, Delay Days
- Charts: Daily Bore Count, Depth Progress, Planned vs Actual, Cost Variance

**O&M Dashboard:**
- KPIs: Open Tickets, SLA %, PM Completion %, Repeat Failures
- Charts: Ticket Status Donut, SLA Compliance, MTTR Trend
- Tables: Technician Allocation
- Timeline: AMC Renewal

---

## Reports & Alerts
**Reports:** Every vertical must have Daily, Monthly, and Yearly reports featuring Graph View, Table View, Export PDF, and Export CSV. Admin needs Combined Reports and Cross Vertical Reports.
**Alerts:**
- Equipment: Insurance/Fitness expiry within 30 days
- Rental: Contract expiry within 7 days
- Operations: Equipment breakdown
- O&M: SLA breach risk, Missed PM schedule
- Finance: Invoice overdue >45 days

---

## Documentation & Image Uploads
Users must be able to upload Equipment Photos, Site Photos, Piling Progress Photos, Ticket Attachments, Maintenance Photos, and Documents.
**Storage:** Supabase Storage. Database stores `file_url`, `file_name`, `uploaded_by`, `uploaded_at`. Never store images directly inside PostgreSQL.

---

## Current Backend Progress (Phases 1-6 Completed)
**Infrastructure:**
- Supabase connected successfully (PostgreSQL + JWT configured).
- Role-based access logic strictly implemented in `backend/app/auth/dependencies.py`.

**Working APIs & Routers:**
- Authentication (`/auth/login`)
- Assets Master (`/assets`)
- Rental Contracts (`/rental-contracts`)
- Rental Daily Logs (`/rental-daily-logs`)
- Rental Dashboard Summary (`/rental-dashboard/summary`)
- Rental Alerts (`/rental-alerts`)
- Rental Reports (`/rental-reports`)
- Piling Daily Logs (`/piling-logs`)
- Piling Dashboard Summary (`/piling-dashboard/summary`)
- O&M Tickets (`/om-tickets`)
- O&M Dashboard Summary (`/om-dashboard/summary`)

**Database Tables Already Existing:**
- `users`, `assets_master`, `rental_contracts`, `rental_daily_logs`, `piling_daily_logs`, `om_tickets`, `projects`, `clients`, `vendors`.
*(Associated schemas and models exist and are functional. Do not rebuild them. Extend them only if required.)*

---

## Remaining Build Order (Start from Phase 7)
You must follow this build order exactly. Build one module completely before moving to the next. Keep architecture clean, avoid over-engineering, use FastAPI routers and SQLAlchemy ORM.

**Phases to Complete:**
7. Finance Module
8. Maintenance Module
9. Admin Dashboard
10. Reports Engine
11. Alerts Engine
12. Supabase Storage Integration
13. React Frontend (Setup and routing)
14. Frontend RBAC
15. Dashboard Visualizations
16. Final Testing
17. Deployment
