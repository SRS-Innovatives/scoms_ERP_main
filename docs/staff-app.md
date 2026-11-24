# Staff App (`scoms-app-staff/`)

React Native CLI, TypeScript. Talks to the mobile gateway at
`/api/v1/mobile/staff` (see `docs/mobile-architecture.md`, `docs/mobile-api.md`).

## Navigation: App Module Access + role

`src/navigation/moduleRegistry.tsx` maps each Staff App module to its screen, icon and
the roles that screen serves. An entry shows when Super Admin's App Module Access
(`GET /app-modules`, `src/services/api/appModules.ts`) says the module is visible for this
user **and** the role is one the screen serves today. The first 3 visible tab-eligible
entries become bottom tabs; the rest go into More, grouped as Teaching / My Desk / My Work.

| Role | Tabs (everything visible) | More |
|---|---|---|
| Teacher | Home · Attendance · Homework · Exams · More | Leave Approvals, Study Materials, Timetable, My Leave, Exam Duties, Notices, Calendar, PTM Notes, Messages |
| HOD | Home · Attendance · Homework · Exams · More | Leave Approvals, Corrections, Study Materials, Timetable, My Leave, Exam Duties, Notices, Calendar, PTM Notes, Messages |
| Librarian / Transport / Hostel / Exam Admin / Placement | Home · *their desk* · Timetable · More | My Leave, Exam Duties, Notices, Calendar |
| Accountant | Home · Timetable · More | My Leave, Exam Duties, Notices, Calendar |
| Staff | Home · Timetable · More | Study Materials, My Leave, Exam Duties, Notices, Calendar, Messages |
| Principal, Vice Principal | Home · Leave Approvals · Corrections · More | My Leave, Exam Duties, Notices, Calendar, PTM Notes, Messages |

Messages and SMS start hidden until Super Admin turns them on.

### Collaboration modules

| Screen | API | Notes |
|---|---|---|
| PTM Notes | `GET/POST /parent-meetings`, `GET /parent-meetings/students` | Teacher, HOD, Principal, VP (ptm.manage). Only students of classes you teach; parents are notified and see it in Parent Corner. |
| Corrections | `GET /attendance-corrections`, `POST /attendance-corrections/:id/review` | HOD: only their department's sections; Principal / VP: the whole institution (`teachingScope.getCorrectionReviewSectionIds`, same rule as leave approvals). The Institute Admin portal still sees all. |
| Study Materials | `/materials`, `/materials/download-history`, `/materials/:id/downloads` | Share a web link (file uploads stay on the web portal); see who opened each item. |
| Exam Duties | `GET /exam-duties/mine` | Next-duty card, grouped by exam. |
| Messages | `/messages/students`, `/messages/conversation`, `POST /messages` | Students of classes you teach. An open chat polls every 15 s with `?after=<newest>` (only new rows), paused in the background. |

### Desk dashboards and lighter queries

- **Desk roles** (Librarian, Transport, Warden, Exam Admin, Placement) get their key numbers
  on Home from the same single summary request (`desk` section, counts only).
- **Hostel beds:** `GET /hostel/beds?status=vacant|occupied&q=&page=&limit=` filters and pages
  on the server; the app loads 50 at a time (infinite scroll). Without `?page` the response is
  the same array as before (web portal unchanged).
- **Searches** (library books / students, hostel students) wait until you pause typing
  (`src/hooks/useDebouncedValue.ts`) and are cached per query string.
- **Roster:** attendance % comes from a grouped count; the app now sends `subjectId`, so an
  elective's roster is only the students who chose it.

The "classes I teach" lookup behind messages and PTM is cached (`shared/academic/taughtSections.js`) and dropped whenever SubjectTeacherMapping changes.

More always ends with Notifications and Profile. If Super Admin hides a tab module, the
next one moves up (a Teacher without Attendance gets Homework · Exams · Timetable). The
Fee Desk is gone from the app: `/fee-desk` is closed for every staff role on the server.

- **Adding a module screen:** add its key to `src/navigation/moduleKeys.ts` (must exist in
  `shared/appModules/catalog.js` STAFF_APP), its screen name to `ModuleScreenName` in
  `types.ts`, and one entry to `MODULE_REGISTRY`. Its `roles` must be a subset of the
  catalog's roles for that module (`__tests__/moduleLayout.test.ts` checks this).
- **Refresh:** the module list re-loads when the app returns to the foreground, on
  dashboard pull-to-refresh, and whenever the gateway answers `403 APP_MODULE_HIDDEN`. A
  screen open at that moment shows `ModuleUnavailableView`.
- **Fallback:** if `/app-modules` can't be loaded, visibility falls back to
  `institution.enabledModules` from `/auth/me` (`LEGACY_REQUIRES`).
- **Quick actions** on the dashboard follow the same layout (`useOpenModule` opens a
  module whether it's a tab or in More).
- Permissions: `test/staffNavPermissionCoverage.test.js` checks every role has the
  permissions its screens call.

## Visual system

`src/constants/theme.ts`: teal brand (different from the student app's indigo), one
`moduleColors` accent per module (dashboard tiles, quick access, More icons), `shadow()`
elevation, `ROLE_LABELS`. Shared pieces in `src/components/`: `Button` (primary /
secondary / danger, optional icon), `Card`, `TextField` (icon, password reveal),
`Avatar`, `StatTile`, `IconTile`, `Chip` (+ `statusTone()`), `SectionHeader`,
`DateStrip` (tap-a-day date picker, no native dependency), `EmptyView`, `ErrorView`.
Dates: `src/utils/dates.ts` — local-time only (never `toISOString()` for a calendar day).

- **Dashboard:** teal hero (greeting, name, role badge, bell with unread count), tappable
  stat tiles, "In progress / Up next" card, today's timeline, quick-access grid built from
  the module layout.
- **Attendance:** P / A / OD buttons per student, live counts, All P / All A, search,
  low-attendance (< 75%) highlight, confirm before submit, Android back returns to the
  class list.
- **Leave / Homework:** chips + `DateStrip` + day counter instead of typed dates.

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
