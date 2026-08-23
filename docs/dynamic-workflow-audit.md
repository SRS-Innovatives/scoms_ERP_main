# SCOMS Dynamic Workflow Audit Report

## 1. Frontend Static Data Analysis

The frontend applications for all four portals are currently built primarily as static/mock UIs. Almost every page relies on hardcoded data rather than real API calls.

### SuperAdmin Portal (`SuperAdmin_module_forntend`)
- **Massive Mock Data Usage**: Imports fake data from multiple files including `mockInstitutionsData.js`, `mockUsersData.js`, `mockSubscriptionsData.js`, `mockBillingData.js`, `mockSupportData.js`, `mockAuditLogs.js`, and `mockAnalyticsData.js`.
- **State Persistence**: Uses `localStorage` (e.g., `scoms_superadmin_user`) to hold fake login sessions.
- **Lists and Forms**: `InstitutionListPage` uses `mockInstitutions`. When an institution is created, it's just pushing to a local React state array or doing a fake API call that doesn't refresh the list from the database.

### InstituteAdmin Portal (`IntituteAdmin_module_frontend`)
- **Centralized Mock Data**: Relies heavily on a massive `src/data/mockData.js` file.
- **Widespread Hardcoding**: Found over 40+ files importing static arrays like `studentsList`, `staffList`, `departments`, `courses`, `academicYears`, `feeStructures`, `feeTransactions`, `transportRoutes`, and `instituteInfo`.
- **Dashboard**: Uses static analytics numbers (`chartData`, `feeTransactions`).
- **Auth**: Uses `scoms_admin_token` but many flows bypass actual backend verification or rely on dummy user objects.

### Staff Portal (`Staff_module_frontend`)
- **Mock Data**: Uses `mockStaffData.js` containing `mockStaffProfile`, `mockDashboardStats`, `mockAssignedClasses`, `mockStudentsList`, and `mockWeeklyTimetable`.
- **Auth**: Stores fake sessions via `localStorage.getItem('scoms_staff_user')`.

### Student Portal (`Student_module_frontend`)
- **Mock Data**: Uses `mockStudentData.js` containing `mockStudentSubjects`, `mockTodaySchedule`, `mockAssignments`, `mockExams`, `mockFeeLedger`, and `mockAnnouncements`.
- **Auth**: Stores fake sessions via `localStorage.getItem('scoms_student_user')`.

---

## 2. Backend Static Data Analysis

The backend (Node.js/Express) is partially implemented with Prisma ORM.
- **Real Database Usage**: `institutionController.js` and `studentController.js` are actively using Prisma for CRUD operations. They contain proper transactions, database lookups, and relationship inserts.
- **Mock Fallbacks**: Some controllers act as placeholders. For example, `supportController.js` returns a hardcoded `mockTickets` array because the `SupportTicket` model hasn't been implemented in Prisma yet.
- **Missing APIs**: While basic CRUD exists for core entities, APIs for specific dashboard aggregations (e.g., `GET /api/v1/institute/dashboard`), attendance marking, and complex fee calculations are either missing or returning static objects.

---

## 3. Database & Relationship Problems

The `schema.prisma` is well-structured but requires strict enforcement:
- **Tenant Isolation**: Most models have an `institutionId` relation. However, we must ensure that the backend controllers actually scope their `where` clauses using `req.user.institutionId` (which some currently do, like `studentController.js`, but this must be audited for every endpoint).
- **Multi-Tenant Leakage**: We need to ensure that `GET /api/v1/students` doesn't return students from other institutions.
- **Missing Models**: Some entities like Support Tickets, dynamic dashboard analytics, and granular Permissions might be missing or incomplete.
- **Transactions**: Complex operations (like student admission) correctly use `$transaction` in `studentController.js`, which is a good pattern that must be replicated across all creation flows.

---

## 4. Form/API Mismatches

- **Fake Success**: Frontend API clients (`api.js`) have a graceful fallback mechanism: `setTimeout(() => resolve({ status: 200, data: options.mockResponse }))`. When a backend call fails (e.g., 401 Unauthorized), the frontend swallows the error and returns mock data, giving a false sense of success.
- **Missing Invalidation**: React state is not refetching data after a mutation. The standard pattern used is `setInstitutions([...institutions, newRecord])`, which disappears on page reload.
- **Dropdown Dependencies**: Dropdowns (Academic Year → Department → Course → Semester → Section → Subject) are currently populated with static arrays instead of dynamic, chained API calls.

---

## 5. Authentication & Tenant Isolation Problems

- **Frontend Bypasses**: The Unified Login page successfully hits the backend and retrieves a real JWT, but until recently, the context providers were overriding this with fake user data.
- **Middleware Gaps**: The backend `requireAuth` and `requireRole` middlewares exist, but need strict verification to ensure they are applied to *every* route.
- **Tenant Context**: The Institute Admin frontend must never send `institutionId` in the body for standard operations. The backend must derive `req.institutionId = req.user.institutionId`.

---

## 6. Recommended Fixes (Phase-by-Phase Execution)

As per the requirements, we will address these issues sequentially. The overarching strategy is:
1. **Purge Mock Data**: Systematically remove `mockData.js` imports from frontend components.
2. **Implement React Query**: Introduce a data fetching library (like TanStack Query) or robust `useEffect` patterns to handle caching, loading states, and invalidation properly.
3. **Strict API Clients**: Remove the "mock fallback" logic in `api.js` across all portals so that backend errors actually crash the UI or show real error toasts.
4. **Backend completeness**: Ensure every frontend page has a corresponding, fully functional PostgreSQL-backed API route.
5. **Tenant Isolation**: Audit every backend controller to guarantee `where: { institutionId: req.user.institutionId }` is enforced.
