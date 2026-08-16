# SCOMS - School College Management System

This is the multi-tenant backend platform and frontend applications for the School College Management System (SCOMS). This repository contains all the necessary modules for Super Admins, Institute Admins, Staff, and Students.

## Project Structure

The project is structured as a monorepo containing several backend and frontend modules:

### Backends (NPM Workspaces)
These are Node.js applications managed via npm workspaces from the root directory.
- `SuperAdmin_Backend`
- `IntituteAdmin_Backend`
- `Staff_backend`
- `Student_Backend`
- `shared` (Shared utilities/code across backends)

### Frontends (Vite + React)
These are independent Vite React applications.
- `SuperAdmin_module_forntend`
- `IntituteAdmin_module_frontend`
- `Staff_module_frontend`
- `Student_module_frontend`

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm
- A database (e.g., PostgreSQL, MySQL) as configured in your Prisma schema

### 1. Root and Backend Setup

The backend modules are connected via NPM Workspaces, which means you can install all backend dependencies from the root directory.

1. **Clone the repository and navigate to the root directory.**
2. **Install all backend dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Copy the `.env.example` file to `.env` in the root directory and update it with your database credentials and other configuration variables.
   ```bash
   cp .env.example .env
   ```
4. **Database Setup (Prisma):**
   Run the following commands from the root directory to generate the Prisma client, run migrations, and optionally seed the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

### 2. Frontend Setup

Each frontend module is an independent Vite application and needs its own dependency installation.

Open separate terminal windows and run the following for each module you want to use:

**Super Admin Frontend:**
```bash
cd SuperAdmin_module_forntend
npm install
```

**Institute Admin Frontend:**
```bash
cd IntituteAdmin_module_frontend
npm install
```

**Staff Frontend:**
```bash
cd Staff_module_frontend
npm install
```

**Student Frontend:**
```bash
cd Student_module_frontend
npm install
```

---

## Running the Applications

### Starting the Backends
You can start all backend servers at once from the root directory using the `dev` script:

```bash
npm run dev
```

Alternatively, you can start each backend server individually from the root directory using the predefined npm scripts:

- **Super Admin Backend:** `npm run start:super-admin`
- **Institute Admin Backend:** `npm run start:institute-admin`
- **Staff Backend:** `npm run start:staff`
- **Student Backend:** `npm run start:student`

### Starting the Frontends
To start a frontend development server, navigate to its directory and run `npm run dev`:

**Super Admin Frontend:**
```bash
cd SuperAdmin_module_forntend
npm run dev
```

**Institute Admin Frontend:**
```bash
cd IntituteAdmin_module_frontend
npm run dev
```

**Staff Frontend:**
```bash
cd Staff_module_frontend
npm run dev
```

**Student Frontend:**
```bash
cd Student_module_frontend
npm run dev
```
