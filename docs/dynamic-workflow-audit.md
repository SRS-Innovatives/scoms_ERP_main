# SCOMS Dynamic Workflow Audit Report — Phase 1

Generated 2026-08-25. Scope: full repo (4 backend services, 4 frontend apps, shared lib, Prisma schema/DB). Every claim below is backed by a file:line reference so it can be verified directly — this supersedes the earlier draft of this document, which mischaracterized a few things (notably the frontend "mock fallback," which turns out to be dead code, not a live behavior).

## Repo shape

Four independent Express apps (npm workspaces) sharing **one** `shared/` library and **one** Prisma schema/Postgres database — not a monolith, not four separate databases:

| Portal | Backend | Port | Frontend |
|---|---|---|---|
| Super Admin | `SuperAdmin_Backend` | 5001 | `SuperAdmin_module_forntend` |
| Institute Admin | `IntituteAdmin_Backend` | 5002 | `IntituteAdmin_module_frontend` |
| Staff | `Staff_backend` | 5003 | `Staff_module_frontend` |
| Student | `Student_Backend` | 5004 | `Student_module_frontend` |

`shared/` holds `auth/` (JWT, password hashing), `middleware/` (`requireAuth`, `requireTenant`, `requirePermission`, `errorHandler`), `database/client.js` (Prisma singleton), `permissions/permissionMatrix.js`, `utils/notifications.js`. `prisma/schema.prisma` is the single schema; no per-portal duplicate models exist.

---

## 1. Frontend Static Data

- **Super Admin**: mostly real, but dead-code mock files remain: `src/data/mockAnalyticsData.js, mockAuditLogs.js, mockBillingData.js, mockIndianStates.js, mockSmsData.js, mockSubscriptionsData.js, mockSupportData.js, mockUsersData.js`. `SuperAdminDashboardPage.jsx:4-5` imports `mockBillingStats`/`mockAnalytics` but never uses them (dashboard actually reads live services) — safe to delete once confirmed unused elsewhere.
- **Institute Admin** — the worst offender: single `src/data/mockData.js` (463 lines: `instituteInfo`, `dashboardStats`, `chartData`, `academicYears`, `departments`, `courses`, `studentsList` (full fake records incl. Aadhaar numbers/photos), `staffList`, `feeCategories/feeStructures/feeTransactions/bankChallans`, `announcements`, `libraryBooks`, `transportRoutes`, `hostelBlocks`, `inventoryAssets`). **53 of 119 page files** import from it.
  - Confirmed break: [IntituteAdmin_module_frontend/src/Pages/student/StudentListPage.jsx:6](IntituteAdmin_module_frontend/src/Pages/student/StudentListPage.jsx#L6) imports the static `studentsList` — a student admitted through the real `StudentAdmissionPage` API call will never show up here, because the list page never calls the API at all.
  - Inline hardcoded arrays that bypass even the working `/setup/*` endpoints: `Pages/setup/SemesterSetupPage.jsx:9-13`, `Pages/setup/SectionSetupPage.jsx:8-12`, `Pages/setup/SubjectSetupPage.jsx:8-13`.
- **Staff**: `src/data/mockStaffData.js` (158 lines: profile, dashboard stats, schedule, assigned classes, student list, assignments, submissions, question bank, study materials, exam duties, leave balance, notifications, lab/library inventory, weekly timetable). **36 of 92 pages** import it. **Zero pages** call any API at all.
- **Student**: `src/data/mockStudentData.js` (58 lines). **16 of 53 pages** import it directly, bypassing the real services layer that does exist (see §12).

## 2. Backend Static Data

- `SuperAdmin_Backend/src/controllers/supportController.js:6-18` — comment: *"no Support Ticket table in schema yet, sending mock data"*; returns hardcoded `TKT-001`/`TKT-002`.
- `SuperAdmin_Backend/src/controllers/aiController.js:6-19` — fully hardcoded usage stats object.
- `SuperAdmin_Backend/src/controllers/settingsController.js:6-20` — fully hardcoded settings object, no persistence.
- `SuperAdmin_Backend/src/controllers/smsController.js:6-17` — hardcoded SMS provider stats.
- `Student_Backend/src/controllers/feePaymentController.js:40-48` — Razorpay order creation is fully mocked (`order_rzp_<timestamp>_<rand>`, no real API call, `key` defaults to `'rzp_test_mock_key'`).
- `Student_Backend/src/controllers/aiAssistantController.js:10-26` — "AI response" is a hardcoded template string, no LLM call despite an `AI_API_KEY` env var existing.
- `shared/utils/notifications.js:12-106` — email/SMS sends silently fall back to console-logging ("SIMULATED EMAIL/SMS") whenever creds look like placeholders, which they are today per `.env`/`.env.example`. This means welcome-credential emails referenced in `IntituteAdmin_Backend/src/controllers/studentController.js:196-208` and `staffController.js:100-112` never actually reach anyone right now.

## 3. Broken APIs

- `Student_Backend/src/controllers/feePaymentController.js:54-125 verifyOnlinePayment` — destructures `razorpaySignature` from the body but never computes/checks an HMAC against it; only checks `razorpayPaymentId` is truthy, then marks payment `SUCCESS`. A student can fabricate a payment ID and get their fee marked paid.
- `Staff_backend/src/controllers/assignmentController.js:54-72 evaluateSubmission` — `prisma.assignmentSubmission.update({ where: { id: submissionId }, ... })` with **no** `staffId`/tenant filter. Any authenticated staff member from any institution who knows/guesses a submission ID can grade it.
- `Student_Backend/src/controllers/feePaymentController.js:28-52` and `IntituteAdmin_Backend/src/controllers/feeController.js:100-102` — both fetch `StudentFeeAssignment` by raw `id` with no check that it belongs to the requesting student/institution (that model has no `institutionId` field of its own to check against, compounding the gap).
- `SuperAdmin_Backend/src/controllers/userController.js:144-153 updateRolePermissions` — accepts and echoes back `{ role, permissions }` but writes nothing to any table (there's no `RolePermission` model to write to).

## 4. Missing APIs

- **No Announcement endpoints anywhere**, despite an `Announcement` model existing in `schema.prisma` — grepped every backend controller/route, zero matches; only referenced in frontend mock/nav files.
- No exam/marks-entry routes beyond the Staff question-bank generator (`Staff_backend/src/routes/apiRoutes.js:34-35`) — nothing for Institute Admin to view/verify/publish results.
- No payment/receipt **listing** endpoints (create-only: `POST /fees/pay/initiate`, `POST /fees/pay/verify`).
- Semester/Section/Subject setup routes have only `GET`/`POST` — no update/delete (`IntituteAdmin_Backend/src/routes/apiRoutes.js:27-43`).
- No institute-level attendance-view endpoint (only Staff `POST /attendance/mark` and Student `GET /attendance`).
- No Notification API despite a `Notification` model in schema.

## 5. Database Problems

- Schema is a single well-structured file (`prisma/schema.prisma`, 1047 lines); `npx prisma migrate status` confirms migrations applied and in sync — no drift.
- Seed (`prisma/seed/seed.js`) is real and idempotent: 1 Super Admin, 2 demo institutions, 1 Institute Admin, full academic chain (year→dept→course→semester→section), 1 staff, 1 student, 1 parent, 1 fee structure/assignment/payment/receipt.
- Gaps: no `SupportTicket` model (backing §2's mock), no `RolePermission` model (backing §3's no-op), `StudentFeeAssignment` and `CertificateRequest` have no `institutionId` of their own (see §6/§9).

## 6. Relationship Problems

Most models carry `institutionId` directly and enforce it via unique constraints (`Institution/User/AcademicYear/Department/Course/Student/Staff/FeeStructure/FeePayment` etc. all `@@unique([institutionId, ...])`). A second tier of models is scoped only *indirectly*, through a parent FK, and controllers must join up manually to enforce tenancy: `Semester`(→Course), `Section`(→Semester→Course), `Subject`(→Course), `AttendanceRecord`(→Session), `ExamSchedule`(→Exam), `StudentMark`(→ExamSchedule), `StudentFeeAssignment`(→FeeStructure/Student — no institutionId at all), `CertificateRequest` (studentId only, no institutionId at all). These indirect-scope models are exactly where the IDOR gaps in §3 live — they're the ones a raw `findUnique({ where: { id } })` skips tenant checking on.

## 7. Authentication Problems

- JWT payload correctly includes `institutionId`/`studentId`/`staffId` (`shared/auth/unifiedAuth.js:91-98`); `requireAuth` (`shared/middleware/requireAuth.js:8-29`) populates `req.user` from it correctly.
- `shared/auth/jwt.js:12-26` falls back to hardcoded default secrets (`'scoms_super_secret_access_key_2026'` etc.) if `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` env vars are unset — a real risk if any deployment forgets to set them.
- `shared/components/UnifiedLoginPage.jsx:19-108` hardcodes demo credentials per portal that auto-fill the login form, and on token-missing responses falls back to a literal `'demo_access_token'` string (`:165-186`) instead of failing the login.
- **Staff portal has no `AuthContext` at all** — `Staff_module_frontend/src/context/` contains only `NotificationContext.jsx`/`ThemeContext.jsx`. Session state isn't tracked client-side beyond raw localStorage token reads used ad hoc.

## 8. Authorization Problems

- `requirePermission`/role guards exist and are applied per-portal router-wide (e.g. `SuperAdmin_Backend/src/routes/apiRoutes.js:25-26` wraps everything except `/auth/*` in `requireAuth` + `requireRole(SUPER_ADMIN, PLATFORM_ADMIN)`).
- The permission catalog (`shared/permissions/permissionMatrix.js`) is hardcoded in code, and the frontend's matching UI catalog (`PermissionMatrixPage.jsx:21-151`, ~60 entries) is a separately maintained static list — the two can drift with no automated check, and `updateRolePermissions` doesn't persist changes anyway (§3), so the Permission Matrix page currently can't actually change any real authorization behavior.

## 9. Tenant Isolation Problems

The core pattern is genuinely solid: `shared/middleware/requireTenant.js:9-34` sets `req.institutionId` strictly from `req.user.institutionId` (Super Admin may override via an `x-institution-id` header, by design, since it operates across tenants). A repo-wide grep for `req.body.institutionId` / `req.params.institutionId` / `req.query.institutionId` returned **zero matches** — no controller trusts a client-supplied tenant ID.

The exceptions are the indirect-scope models from §6: `evaluateSubmission`, `initiateOnlinePayment`/`verifyOnlinePayment`, and `collectOfflineFee` (§3) fetch by raw record ID without confirming that record belongs to the caller's institution/own student profile. These are the only tenant-isolation holes found.

## 10. Form/API Mismatches

- Institute Admin setup pages for Semester/Section/Subject render entirely from inline hardcoded arrays and never call the `/setup/*` endpoints that already exist and already work for the admission/registration flow — so admin-entered semesters/sections/subjects there are never persisted or read from the DB at all; it's not a field-name mismatch, it's a full disconnect between page and API.
- Several "create" UI actions are non-functional stubs that show a success toast without calling any service: `SuperAdmin_module_forntend/src/components/modals/CreateRoleModal.jsx:12-16`, `IntituteAdmin_module_frontend/Pages/setup/AcademicYearSetupPage.jsx:55`, `Pages/setup/DepartmentSetupPage.jsx:34`.
- `SuperAdmin_module_forntend/src/pages/institutions/InstitutionListPage.jsx:88-93` (status toggle) and `:124` (export) are toast-only, no backend call.
- No field-name (camelCase/naming) mismatches were found between the working frontend services and backend controllers that were reviewed — the disconnects found are architectural (page never calls API) rather than payload-shape mismatches.

## 11. Dashboard/Static Analytics Problems

- Institute Admin dashboard numbers (`dashboardStats`, `chartData` in `mockData.js:26-72`) are static literals (e.g., specific INR collection figures, student counts) with no corresponding `GET /api/v1/institute/dashboard` aggregation endpoint implemented server-side yet.
- Staff dashboard stats (`mockDashboardStats` in `mockStaffData.js`) are entirely static; no staff dashboard aggregation endpoint exists.
- Student dashboard fields are partly real, partly hardcoded in the same object: `Student_module_frontend/src/context/StudentAuthContext.jsx:64-83` sets `classTeacher`, `gpa`, `attendancePercentage`, `batch` as literal strings even on the authenticated-login code path, while `name`/`email`/`department` correctly come from the API response.
- Super Admin dashboard is the one dashboard that is genuinely live (reads real `analyticsService`/`billingService` data), though its unused mock imports (§1) should be removed for clarity.

## 12. Module Integration Problems

- **Institute Admin**: only 2 of 119 pages (`StudentAdmissionPage.jsx`, `StaffRegistrationPage.jsx`) call any backend API; every other module (departments, courses, semesters, sections, subjects, staff list, student list, fees, announcements, library, transport, hostel, inventory) is an island reading only `mockData.js`.
- **Staff**: 0 of 92 pages call any backend API at all — the entire portal is disconnected from the database despite working backend endpoints existing (`Staff_backend/src/routes/apiRoutes.js`).
- **Student**: a real services layer exists (`studentService.js`, `attendanceService.js`, `assignmentService.js`, `feeService.js`) that correctly targets live endpoints, but it is **dead code** — grepped every page under `Student_module_frontend/src/pages`, zero imports of any of these services. 16/53 pages import `mockStudentData.js` directly instead. The existing services also reference a non-existent `mockResponse` option in their own `apiCall` usage (e.g. `attendanceService.js:5`), which the shared `api.js` wrapper never reads — leftover scaffolding from an earlier iteration.
- **Cross-module**: because Institute Admin's student list/staff list never re-fetch from the API, a student or staff member created through the one working admission/registration flow is invisible everywhere else in that same portal.

## 13. Duplicate Models

None found. Single Prisma schema, single set of models, no `super_admin_students`/`staff_students`/`student_students`-style duplication, no separate schema files per portal. This part of the architecture is already correct and should be preserved as-is going forward.

## 14. Hardcoded IDs

- No hardcoded `institutionId`/`studentId` values were found baked into backend query logic — all backend scoping correctly derives from `req.user`/`req.institutionId` (see §9).
- Frontend hardcoded IDs are confined to mock data records (e.g., `studentsList` entries in `mockData.js` carry fabricated IDs) — not a live-code hardcoding-of-a-real-tenant-ID problem, but these IDs are what pages route around/link to, so once mock imports are removed the pages need to switch to IDs returned by the API instead.
- `shared/components/UnifiedLoginPage.jsx:19-108` hardcodes per-portal demo login credentials (not IDs, but effectively hardcoded identity shortcuts) that should be gated behind a dev/demo-mode flag rather than shipped unconditionally.

---

## 15. Recommended Fixes — Priority Order for Phase 2 onward

The database and tenant-isolation core (Phases 2–7 in the user's spec) are largely already sound; effort should front-load where the "static app" symptom is actually coming from:

1. **Institute Admin portal**: build out the missing service layer (`departmentService`, `courseService`, `semesterService`, `sectionService`, `subjectService`, `staffService`, `studentService`, `feeService`, `announcementService`, etc.) and rewire all 53 mock-driven pages to it, starting with Student List / Staff List (the ones that hide the admission/registration work that already succeeds) and the Semester/Section/Subject setup pages (which currently bypass working endpoints entirely).
2. **Staff portal**: add an `AuthContext` + protected-route guard (currently missing entirely), build its service layer, and wire all 92 pages off `mockStaffData.js` onto the real `Staff_backend` endpoints.
3. **Student portal**: wire the 16 mock-driven pages onto the *existing* real service layer (`studentService`/`attendanceService`/`assignmentService`/`feeService`) — this is the cheapest win since the services already work, they're just unused. Remove the hardcoded fields in `StudentAuthContext.jsx:64-83`.
4. **Close the IDOR/tenant-ownership gaps**: `evaluateSubmission`, `initiateOnlinePayment`/`verifyOnlinePayment`, `collectOfflineFee` — add ownership `findFirst` checks before mutating.
5. **Payment integrity**: implement real Razorpay signature verification in `verifyOnlinePayment` before marking any payment `SUCCESS`.
6. **Fill missing routes**: Announcements (full CRUD + target-audience filtering per spec), exam/marks entry + result publish for Institute Admin, payment/receipt listing endpoints, Semester/Section/Subject update/delete.
7. **Super Admin dead buttons**: wire `CreateRoleModal`, institution status-toggle, and export to real API calls (or real client-side export logic backed by real data).
8. **Decide fate of the fully-mock Super Admin controllers** (`supportController`, `aiController`, `settingsController`, `smsController`): either add the backing Prisma models and make them real, or explicitly flag them as out-of-scope/demo-only in the UI so they stop looking like broken features.
9. **Hygiene**: remove dead mock-data files and unused imports once their pages are migrated; move hardcoded JWT secret fallbacks and demo-login credentials behind explicit dev-only guards; add a real Jest/integration test suite (current `test/tenantIsolation.test.js` is a hand-rolled unit check, not an end-to-end test) to cover the two-institution isolation scenario the user's spec requires.

This ordering is deliberately front-loaded on frontend↔backend wiring (items 1–3) because that's what's producing the "creates institution/student but it doesn't appear" symptom the user described — the backend and database underneath are already largely correct.

**Do not proceed to code changes until this report is reviewed** — per the user's explicit Phase 1 instruction, this document is the full deliverable for Phase 1.
