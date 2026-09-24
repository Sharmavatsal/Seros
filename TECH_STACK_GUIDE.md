# SEROSOPS Tech Stack — Simple Explanations (Interview Guide)

A plain-English version of how every technology in SEROSOPS fits together, what its job is, and what to say in an interview.

---

## 1. The Big Picture (Read This First)

SEROSOPS is a **full-stack web app**: a React frontend (what managers see in the browser) talking to a Python backend (the "brain" that does the work) that reads/writes a PostgreSQL database hosted by Supabase.

A single request travels like this:

```
Browser (React UI)
      │  axios sends "GET /api/rental-dashboard/summary" with a JWT token
      ▼
Vite Dev Server (port 5173)  ── proxies /api/* ──►  FastAPI (port 8000)
                                                          │
                                              SQLAlchemy builds the SQL query
                                                          ▼
                                          PostgreSQL on Supabase (the database)
                                                          │
                                              JSON response flows all the way back
                                                          ▼
React re-renders → charts (Recharts) and tables update
```

**The golden rule to remember:** the browser *never* talks to the database directly. Every piece of data has to go through the API, and every API call is authenticated with a JWT token.

---

## 2. Frontend Stack (What the user sees)

| Tech | What it is | Job in this project |
|---|---|---|
| **React 18** | UI library (JavaScript) | Renders pages as components (`Login`, `RentalDashboard`, `FinancePage`). Uses hooks like `useState`/`useEffect` to fetch data and re-render. |
| **Vite** | Build tool + dev server | Runs the dev server on port 5173, hot-reloads code changes, and **proxies `/api/*` requests to the backend** so the frontend and backend look like one app during development. Also bundles code for production with `npm run build`. |
| **React Router** | URL/routing library | Maps URLs to pages (`/rental`, `/piling`, `/finance`). Also enforces **frontend role checks** via a `ProtectedRoute` wrapper — if your role isn't allowed, you get redirected to a 403 page. |
| **Tailwind CSS** | CSS framework | Handles all the styling — dark industrial theme, colored status badges (green/amber/red), responsive layouts. Utility classes like `bg-background text-white`. |
| **Recharts** | Charting library | Draws all dashboards: line charts, bar charts, donut/pie, gauge. It just maps an array of `{month, revenue}` objects to a `<LineChart>`. |
| **Zustand** | State management library | A tiny global store (`authStore.js`) that holds the **login token + user + role** in memory and `localStorage`. Any component can read "who is logged in" without prop-drilling. |
| **Axios** | HTTP client | The one function that talks to the backend. One shared instance (`lib/axios.js`) has **interceptors**: a request interceptor automatically attaches `Authorization: Bearer <token>`, and a response interceptor force-logs-out on a 401. |
| **Lucide React** | Icon library | Simple icon components for the sidebar/buttons. |
| **jsPDF + jspdf-autotable** | PDF generator | Generates CSV/PDF report files *client-side* in the browser. |

**Interview line:** *"The frontend is a React SPA. Zustand keeps the auth state in one place, Axios interceptors attach the JWT to every request and auto-logout on expiry, and React Router guards routes by role. All charts are Recharts; Tailwind does all styling."*

---

## 3. Backend Stack (The brain)

| Tech | What it is | Job in this project |
|---|---|---|
| **FastAPI** | Python web framework | Handles every HTTP request. Each feature is a **router** (e.g. `rental_dashboard.py`, `finance.py`) registered in `main.py` under the `/api` prefix. Auto-generates interactive API docs at `/docs`. |
| **Uvicorn** | ASGI server | The actual Python process that runs FastAPI (`uvicorn app.main:app --port 8000`). |
| **SQLAlchemy 2.0** | ORM (Object-Relational Mapper) | Lets us write **Python classes instead of raw SQL**. A model (`class User(Base)`) maps to a table (`users`); queries like `db.query(Asset).filter(...).count()` become SQL under the hood. |
| **Pydantic** | Data validation library | `schemas/` define request/response shapes. When the frontend sends a login JSON body, Pydantic checks the fields and types *before* the handler runs. |
| **PostgreSQL (Supabase)** | The actual database | Stores all business data (users, assets, contracts, logs, invoices). Hosted in the cloud by Supabase; we connect via a `DATABASE_URL` connection string in `.env`. |
| **Supabase** | Database + file storage service | Hosts PostgreSQL *and* provides **object storage** (a bucket named `seros-uploads`) for file/photo uploads — the DB only stores the `file_url`, never the binary. |
| **python-jose** | JWT library | Creates and verifies JWT tokens (`jwt_handler.py`). A token is a signed, tamper-proof string that says "this is user X with role Y." |
| **passlib + bcrypt** | Password hashing | Never stores plain passwords. `verify_password()` compares what you type against the stored bcrypt hash. |
| **openpyxl / pandas** | Excel parsing | Powers the admin "Data Upload" feature: reads `.xlsx` files, maps sheet columns to DB fields, bulk-inserts records. |
| **ReportLab** | PDF generator | Generates reports server-side when the backend needs to return a downloadable PDF. |
| **python-multipart** | Upload parser | Lets FastAPI accept `multipart/form-data`, used for file uploads. |
| **python-dotenv** | Config loader | Loads secrets (`SECRET_KEY`, `DATABASE_URL`, etc.) from `.env` so they're never in code. |

**Interview line:** *"The backend is FastAPI with SQLAlchemy against PostgreSQL on Supabase. Every module has its own router, Pydantic schemas validate input, and auth is JWT-based (python-jose) with bcrypt-hashed passwords. The same marker `@router.get(...)` plus a `Depends(get_rental_access)` guard gives RBAC on the server side."*

---

## 4. How Authentication Works (End to End)

This is the single most likely topic in an interview — learn it cold.

1. User submits email + password on the **Login page**.
2. Axios `POST /api/auth/login` → Vite proxies it → FastAPI's `auth.py`.
3. Backend looks up the user by email, then `verify_password()` checks the bcrypt hash.
4. On success, it creates a **JWT** with `{user_id, email, role, exp (60 min)}` signed with `SECRET_KEY`.
5. The token comes back; Zustand's `setAuth()` saves it to `localStorage`.
6. **Every later request** passes through the Axios request interceptor, which adds `Authorization: Bearer <token>`.
7. On the backend, `get_current_user` (`auth/dependencies.py`) decodes the token, finds the user in the DB, and returns them. Role-guard helpers (`get_admin`, `get_rental_access`, `get_piling_access`, `get_om_access`) then allow/deny (`403`).
8. When the token expires (60 min), the backend answers `401`, and the Axios response interceptor calls `logout()` and redirects to `/login`.

**RBAC is enforced on BOTH sides:**
- **Frontend:** React Router `ProtectedRoute` hides pages you can't see (see the whole `App.jsx` route tree).
- **Backend:** route dependencies enforce it again, so even a hand-crafted request can't leak another vertical's data.

**Interview line:** *"Auth is stateless JWT: bcrypt hash check at login, a signed token with the user's role inside, and every endpoint re-verifies the token via FastAPI dependencies. Role checks run in the backend so frontend hiding is defense-in-depth, not the real security."*

---

## 5. How a Dashboard Actually Loads Data

Trace one feature (Rental Dashboard) end to end — this is your "walk me through a feature" answer:

1. `RentalDashboard.jsx` mounts → a `useEffect` calls an API function.
2. That function does `axios.get('/api/rental-dashboard/summary')` (base URL `/api` is set in `lib/axios.js`).
3. Vite proxy forwards it to `http://localhost:8000/rental-dashboard/summary`.
4. FastAPI's `rental_dashboard.py` handler runs. `Depends(get_rental_access)` checks the JWT + role.
5. SQLAlchemy runs aggregate queries: count assets, sum `monthly_amount` into revenue, utilization % = active/total, and returns **one JSON object** already computed.
6. React receives it, stores it with `useState`, and passes numbers into KPI card components and Recharts charts.

**Key design point to say out loud:** *"The backend pre-computes KPIs and returns chart-ready data — the browser never does the math, it just renders what the API hands back."*

---

## 6. How Dev vs Production Differ

- **Development:** Two processes. Vite on `:5173` proxies `/api/*` to FastAPI on `:8000`. CORS is enabled for localhost origins (`main.py`) so the browser allows cross-origin calls.
- **Production:** `npm run build` turns the frontend into static files (`frontend/dist/`). Notice in `main.py`: if that `dist` folder exists, FastAPI **serves it directly** (`StaticFiles` mounted at `/`) — so a single Python server can serve both the UI *and* the API. You can also split them behind a web server.

---

## 7. Security Checklist (Things Interviewers Ask)

- Passwords are never stored or logged — only bcrypt hashes.
- `SECRET_KEY` (JWT signing key) lives in `.env`, never in `git`.
- Token carries the role; expiry is 60 minutes.
- Vertical isolation: `get_rental_access` etc. make a Rental Manager unable to read Piling or O&M data.
- Backend RLS/guards mean the frontend role-filtering (menu/route hiding) is a UX nicety, not the security boundary.
- `pool_pre_ping=True`, connection timeouts, and statement timeouts in `database.py` make the DB connection resilient.

---

## 8. Quick Cheat-Sheet for Interview Day

**"Why FastAPI?"** — async-capable, auto-validates with Pydantic, free interactive swagger docs at `/docs`, the de-facto modern Python API framework.

**"Why SQLAlchemy?"** — write Python instead of SQL; models match tables 1:1; safe against SQL injection (parameterized queries); easy to keep schema changes in one place (also used with Alembic migrations in this repo).

**"Why Zustand and not Redux?"** — the app only really needs global auth state. Zustand is ~1KB, minimal boilerplate, and reads state synchronously outside React (which the Axios interceptor needs).

**"Why JWT and not sessions?"** — stateless: the backend doesn't store session data, the token itself proves identity + role, and it works seamlessly across the React/API split.

**"Why Supabase?"** — free Postgres hosting + built-in object storage for uploads in one place, with SSL on the connection.

**Data flow in one line:** *React page → Axios (JWT attached) → Vite proxy → FastAPI router → Pydantic/DB dependency guard → SQLAlchemy query → PostgreSQL/Supabase → JSON back → styled by Tailwind, charted by Recharts.*

---

## 9. Folder Map (So You Can Point to Code in the Interview)

```
dboard_vscode/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, registers all routers, serves frontend build
│   │   ├── api/               # One router file per feature (auth, rental_dashboard, finance…)
│   │   ├── models/            # SQLAlchemy tables (user, asset, rental_contract…)
│   │   ├── schemas/           # Pydantic validation shapes
│   │   ├── auth/              # JWT create/decode + role-guard dependencies
│   │   └── core/database.py   # DB engine + session (get_db)
│   └── requirements.txt       # All Python deps
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # React Router + all role-guarded routes
│   │   ├── lib/axios.js       # The one Axios instance + interceptors
│   │   ├── store/authStore.js # Zustand login state (token + user + role)
│   │   ├── pages/             # Login, admin/, rental/, piling/, om/, finance/…
│   │   ├── components/        # layouts, charts, reusable UI
│   │   └── main.jsx           # React entry point
│   └── vite.config.js         # Dev proxy /api → :8000, build chunking
└── .env                       # SECRET_KEY, DATABASE_URL, etc.
```