# Staff App (`scoms-app-staff/`)

React Native CLI, TypeScript. Talks to the mobile gateway at
`/api/v1/mobile/staff` (see `docs/mobile-architecture.md`, `docs/mobile-api.md`).

## Navigation is role-driven, not fixed

Unlike the student app, staff nav tabs vary by role. `src/navigation/
roleNavigation.ts`'s `resolveStaffTabs(role, enabledModules)` decides the tab set at
render time in `MainTabNavigator.tsx` — see `docs/mobile-architecture.md` §5 for the
full table and the reasoning (it's cross-checked against
`shared/permissions/permissionMatrix.js`, not guessed from job title; get this wrong
and a tab just 403s or renders permanently empty — see
`test/staffNavPermissionCoverage.test.js`).

| Role | Tabs | Module |
|---|---|---|
| Teacher, HOD | Home, Attendance, Homework, Examination, More | `attendance` |
| Librarian | Home, Library, More | `library` |
| Transport Manager | Home, Transport, More | `transport` |
| Accountant | Home, FeeDesk, More | `feeDesk` |
| Hostel Warden | Home, Hostel, More | `hostel` |
| Exam Admin | Home, ExamSetup, More | `examSetup` |
| Placement Officer | Home, Placement, More | `placement` |
| Principal, Vice Principal, Staff, anything else | Home, More | — (no working mobile screen yet, see below) |

`More` (every role) holds: Timetable, Leave, Notifications, Profile.

## Modules (`src/modules/<name>/`)

Every module follows `screens/` + `services/` (RN side); the corresponding backend
addition (when there is one) follows `routes.js`/`controller.js`/`service.js` in
`scoms-app-backend/src/modules/<name>/` — see `docs/mobile-architecture.md` §3.

| Module | What it does | Key backend calls |
|---|---|---|
| `dashboard` | Today's classes, homework set, leave status, notifications, quick actions | aggregates below |
| `attendance` | Pick assigned class → today's roster → mark present/absent → submit | `/attendance/my-classes`, `/attendance/roster`, `/attendance/mark` |
| `homework` | List of assignments set by this teacher | `GET /assignments` |
| `examination` | Pick exam duty → enter marks → **Save** only (see below) | `/exams/my-schedules`, `/exam-schedules/:id/roster`, `/exam-schedules/:id/marks` |
| `library` | Issue/return books, search students/books, collect fines | `/library/*` |
| `transport` | Today's vehicle trip log, mark trip complete | `/transport/trips*` |
| `feeDesk` | Pending fees list, record an offline (cash) payment | `/fee-desk/pending`, `/fee-desk/collect` |
| `hostel` | Beds list, allocate (search student → assign) / vacate | `/hostel/beds*`, `/hostel/students` |
| `examSetup` | Exams list (read-only), create new exam with academic-year/type picker | `/exam-setup/exams`, `/exam-setup/academic-years` |
| `placement` | Job postings list, create posting, close posting | `/postings*` |
| `leave` | Leave history + apply | `/leave*` |
| `notifications` | List, mark read, device-token register/unregister | `/notifications*` |
| `profile` | Read-only profile + logout | derived from `/auth/me` |

## Why Examination has no "Publish" button

Publishing results (`RESULTS_PUBLISH`) is a Principal/Vice Principal/Exam Admin
action, not a Teacher/HOD one — only Teacher/HOD reach this screen, and they only
have `MARKS_ENTER`. See `docs/mobile-architecture.md`'s RBAC-review note and
`test/staffNavPermissionCoverage.test.js`. If a future mobile screen for
Principal/VP/Exam Admin needs to publish, it'll need its own institution-wide exam
list — `/exams/my-schedules` won't work for them since it's scoped to
`SubjectTeacherMapping` (i.e. subjects that staff member actually teaches).

## Known gaps

- Hostel bed allocation and Exam Setup's create-exam form both needed a small new
  backend lookup endpoint (`GET /hostel/students`, `GET /exam-setup/academic-years`)
  that didn't exist before this mobile work — added additively, web unaffected. See
  `docs/mobile-architecture.md` §1 and `docs/mobile-api.md`.
- HOD lacks `LEAVE_APPLY` in the real permission matrix — the Leave screen's list
  view still works, but "Apply Leave" will 403 for HOD specifically. Flagged as a
  policy question, not patched.

## Config

`src/constants/config.ts` — same `API_BASE_URL` pattern as the student app, pointed
at `/api/v1/mobile/staff`. See `docs/deployment.md`.
