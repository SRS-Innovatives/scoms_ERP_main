# SCOMS — School & College Management System

SCOMS is an ERP for schools/colleges with **4 separate portals**: Super Admin, Institute Admin, Staff, and Student. Each portal has its own backend (API) and its own frontend (website), but they all share **one database**.

This guide walks you through setting it up from scratch, step by step. No prior experience with this project needed — just follow the steps in order.

---

## 1. What you need installed first

Install these **before** touching the project:

| Tool | Version | Check if installed | Download |
|---|---|---|---|
| Node.js | 18 or newer | `node --version` | https://nodejs.org (LTS version) |
| PostgreSQL | 14 or newer | `psql --version` | https://www.postgresql.org/download/ |
| Git | any | `git --version` | https://git-scm.com |

You don't need Redis, AWS, Razorpay, or any paid service to run this locally — see [Optional services](#5-optional-services-safe-to-skip-for-now) below.

---

## 2. One-time setup (do this once)

### Step 1 — Get the code

```bash
git clone <your-repo-url>
cd SCOMS
```

### Step 2 — Create the database

Open a terminal and log into PostgreSQL (it will ask for the password you set when installing Postgres):

```bash
psql -U postgres
```

Then inside the `psql` prompt, create an empty database for the project:

```sql
CREATE DATABASE scoms_db;
\q
```

That's it — just an empty database. The project creates all the tables for you in Step 4.

### Step 3 — Set up your environment file

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` in a text editor and check/update these two lines to match what you just set up:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/scoms_db?schema=public"
```

Also make sure these two are filled in with **any** long random text (they're required — the app refuses to start without them, on purpose, for security):

```env
JWT_ACCESS_SECRET="anything-long-and-random-goes-here"
JWT_REFRESH_SECRET="a-different-long-random-string-here"
```

Everything else in `.env` (SMS, WhatsApp, email, payment gateway, file storage, AI) can stay as the placeholder text — see [Optional services](#5-optional-services-safe-to-skip-for-now).

### Step 4 — Install dependencies and set up the database tables

Run these from the **root** `SCOMS` folder, in order:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

What each command does:
- `npm install` — downloads all backend dependencies (all 4 backends share this one install, via npm workspaces).
- `npm run prisma:generate` — generates the database client code.
- `npm run prisma:migrate` — creates all the actual tables in `scoms_db`.
- `npm run prisma:seed` — fills in demo data: 2 sample institutions, a Super Admin, an Institute Admin, a teacher, a student, and a parent, so you have something to log in with immediately (see the login table below).

### Step 5 — Install each frontend's dependencies

Each of the 4 frontends is its own small project and needs its own `npm install`. Run these one at a time (any terminal, doesn't matter which):

```bash
cd SuperAdmin_module_forntend && npm install && cd ..
cd IntituteAdmin_module_frontend && npm install && cd ..
cd Staff_module_frontend && npm install && cd ..
cd Student_module_frontend && npm install && cd ..
```

**Setup is done.** You only need to repeat this whole section if you delete `node_modules`, wipe the database, or pull schema changes from git.

---

## 3. Running the project (do this every time)

You need **2 things running at once**: the 4 backends, and whichever frontend(s) you want to look at.

### Start all 4 backends together

From the root `SCOMS` folder:

```bash
npm run dev
```

Leave this terminal open — it's running all 4 backend servers at once, and will auto-restart if you edit backend code. You'll know it worked if you see all 4 servers print something like "running on port 500X".

### Start a frontend

Open a **new** terminal (keep the backend one running) and pick whichever portal you want to work on:

```bash
cd IntituteAdmin_module_frontend
npm run dev
```

Repeat in more terminals for other frontends if you need more than one open at a time.

### Where everything lives

| Portal | Backend API | Frontend (open this in your browser) |
|---|---|---|
| Super Admin | http://localhost:5001 | http://localhost:5173 |
| Institute Admin | http://localhost:5002 | http://localhost:5174 |
| Staff | http://localhost:5003 | http://localhost:5175 |
| Student | http://localhost:5004 | http://localhost:5176 |

You don't need to open the backend URLs in a browser — only the frontend ones. The frontends talk to their matching backend automatically.

---

## 4. Demo logins

The seed script (Step 4 above) creates these accounts so you can log straight in without registering anything:

| Portal | Email | Password |
|---|---|---|
| Super Admin | `superadmin@scoms.in` | `Password@123` |
| Institute Admin | `admin@dpis-delhi.edu.in` | `Password@123` |
| Staff (Teacher) | `teacher@dpis-delhi.edu.in` | `Password@123` |
| Student | `arun.kumar@student.dpis.edu.in` | `Password@123` |

Every account uses the same password: **`Password@123`**

---

## 5. Optional services (safe to skip for now)

The `.env.example` file lists several third-party services. **None of them are required to run or test the app** — if you leave them as placeholder text, the app automatically falls back to a safe "simulated" mode and logs what *would* have happened instead of failing:

- **SMTP / Email** — emails print to the backend's terminal log instead of actually sending.
- **SMS / WhatsApp** — same, logged instead of sent.
- **Razorpay** (online fee payment) — runs in a test/mock mode.
- **File storage (S3 etc.)** — not needed unless you're testing file uploads at scale.
- **Redis** — not currently used by the app; safe to ignore.
- **AI API key** — only needed if you're testing the AI-powered features specifically.

Only fill these in with real credentials when you actually need to test that specific feature for real.

---

## 6. Project structure (what's what)

```
SCOMS/
├── prisma/                       # The one shared database schema + migrations + seed data
├── shared/                       # Code shared by all 4 backends (auth, error handling, etc.)
├── SuperAdmin_Backend/           # Super Admin's API           → port 5001
├── SuperAdmin_module_forntend/   # Super Admin's website        → port 5173
├── IntituteAdmin_Backend/        # Institute Admin's API        → port 5002
├── IntituteAdmin_module_frontend/# Institute Admin's website    → port 5174
├── Staff_backend/                # Staff's API                  → port 5003
├── Staff_module_frontend/        # Staff's website              → port 5175
├── Student_Backend/              # Student's API                → port 5004
├── Student_module_frontend/      # Student's website            → port 5176
├── .env                          # Your local settings (never commit this file)
└── .env.example                  # Template for .env — safe to commit
```

The 4 backends (`SuperAdmin_Backend`, `IntituteAdmin_Backend`, `Staff_backend`, `Student_Backend`) plus `shared` are one npm workspace, installed together from the root. The 4 frontends are separate Vite/React projects, each with their own `npm install`.

---

## 7. Common problems

**"Cannot connect to database" / Prisma errors**
Make sure PostgreSQL is actually running, and that the password in your `.env`'s `DATABASE_URL` matches your real Postgres password.

**"JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set" and the backend won't start**
You skipped Step 3 — open `.env` and put any random text into both of those lines.

**A backend port (5001–5004) or frontend port (5173–5176) is already in use**
Something else on your machine is using that port. Close it, or find and stop the process using that port, then try `npm run dev` again.

**Login says "Session expired" or a login endpoint says "Too many attempts"**
Login is rate-limited on purpose (10 attempts per 15 minutes) to prevent password-guessing attacks — this is expected security behavior, not a bug. Wait a few minutes and try again.

**I changed something in `prisma/schema.prisma` and the app is out of sync**
Run `npm run prisma:generate` again, then `npm run prisma:migrate` to apply the schema change to your database.

**I want to start over with a completely clean database**
Drop and recreate the database (Step 2), then repeat Step 4 (`generate` → `migrate` → `seed`).
