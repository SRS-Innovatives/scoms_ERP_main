# Module System (Mobile)

SCOMS already has a dynamic optional-module system (`shared/moduleRegistry/`,
`shared/middleware/requireModule.js`) that the web app uses to show/hide features
per institution. The mobile apps plug into this unchanged — they don't have their
own module concept.

## How it works

1. Every institution has a set of enabled optional modules — either the legacy
   `Institution.modules` JSON array, or (once migrated) real
   `InstitutionModuleAssignment` rows. `shared/moduleRegistry/resolveModules.js`
   resolves either path to the same output shape, so callers never need to know
   which one an institution is on.
2. `GET /auth/me` calls this resolver and returns
   `institution.enabledModules` alongside the user object.
3. Every route gated by an optional module (attendance, homework, examination, fee,
   library, transport, hostel, placement, ...) is wrapped in
   `requireModule('<key>')` server-side — this runs on **every** request, live, not
   cached in the JWT, so a Super Admin toggling a module off takes effect
   immediately with no re-login needed.

## App Module Access (per app, per role)

On top of the institution's modules, Super Admin can hide modules **in the mobile
apps only**, separately for each role (Institutions → App Module Access).

- **Catalog:** `shared/appModules/catalog.js`. Each app module has a key, the
  institution module it `requires`, the `roles` it applies to, and the API `routes` it
  owns. Paths no module claims are core and are never hidden.
- **Setting columns:** each app lists its Super Admin columns (`columns` in the catalog).
  The Student / Parent app has one per role (Student, Parent). The Staff app has a single
  **All staff** column (`ALL_STAFF`): one switch per module, and the module's `roles`
  (taken from the permission matrix) decide which staff roles actually get it. The page
  shows those roles as tags under each module.
- **Storage:** the `InstitutionAppModuleSetting` table holds only settings that differ from
  the default (`role` = column key), so a missing row means the default: visible, unless
  the module has `defaultHidden` (Staff Messages, SMS) or `defaultHiddenFor` (parents'
  Study Materials).
- **Rule:** a module is visible when the role applies, the institution has the required
  module, and Super Admin hasn't hidden it. This can hide more than the institution
  setting, never unlock more.
- **Enforcement:** `requireAppModule('STUDENT_APP')` / `requireAppModule('STAFF_APP')` on
  the mobile gateway answer `403 APP_MODULE_HIDDEN`. The web portals are unaffected. The
  dashboard summaries also drop sections for hidden modules (mobile only).
- **App:** `GET /api/v1/mobile/student/app-modules` (read by
  `scoms-app-student/src/store/AppModulesContext.tsx`) and
  `GET /api/v1/mobile/staff/app-modules` (`scoms-app-staff/src/services/api/appModules.ts`).
- **Super Admin API:** `GET /app-modules/catalog`, `GET`/`PUT /institutions/:id/app-modules`
  (`?app=STUDENT_APP|STAFF_APP`).
- **Tests:** `test/appModuleVisibility.test.js` (student), `test/staffAppModules.test.js`
  (staff: every gated Staff route is covered, each module's roles hold the permission its
  routes check, one All-staff switch, matrix/save, dashboard).

### Staff App modules

| Group | Modules (roles) |
|---|---|
| Teaching | Timetable & Substitutions (all staff), Student Attendance & Corrections (Teacher, HOD, Principal, VP), Homework (Teacher, HOD), Study Materials (Teacher, HOD, Staff), Student Leave Approvals (Teacher, HOD, Principal, VP), Scholarship Approvals (Teacher, HOD) |
| Examinations | Marks Entry/Review/Results (Teacher, HOD, Principal, VP, Exam Admin), Question Bank (Teacher, HOD, Exam Admin), My Exam Duties (all), Exam Setup (Exam Admin) |
| Communication | Announcements & Circulars (all), Academic Calendar (all), Messages (default off), SMS to Parents (default off), PTM Notes (Teacher, HOD, Principal, VP), Gallery |
| Student Life | Events & Clubs (all), Student Achievements, Counselling Appointments |
| Desks | Library, Transport, Hostel, Placement, Lab Equipment, Expense Logging, Research |
| My Work | My Leave (all), My Attendance (all) |

Fee Desk is not in the catalog: `/fee-desk` is closed for every staff role on the server.

## Mobile-side usage

Both apps read `user.institution.enabledModules` from `AuthContext` and use it purely
for **display** decisions — which dashboard cards or nav tabs to render:

- Student app: `useAppModules().isVisible()` (App Module Access above), with
  `enabledModules` only as a fallback.
- Staff app: `moduleRegistry.tsx`'s `buildModuleLayout(role, isVisible)`, where
  `isVisible` comes from `useAppModules()` (Staff App Module Access) — see
  `docs/staff-app.md` and `docs/mobile-architecture.md` §5.

Both implementations check the same shape the backend resolver produces:
```ts
type EnabledModule = { key: string; name: string; enabled: boolean; permissions?: string[] };
// or, on legacy institutions, a plain string[] of module keys
```

## This is display-only, never security

Every module-gated route independently re-checks `requireModule()` server-side.
Hiding a tab on the client never substitutes for that check, and a client that
skipped the check (a modified app, a raw HTTP client) still can't reach a disabled
module's data — the middleware doesn't know or care what the client rendered.

## Role permissions are a separate, additional layer

A module being enabled for an institution doesn't mean every role can use it.
`shadowPermission(PERMISSIONS.X)` (RBAC) is checked in addition to
`requireModule()` on most routes — see `docs/mobile-architecture.md`'s note on
the staff `moduleRegistry.tsx` roles being cross-checked against `shared/permissions/permissionMatrix.js`,
and `test/staffNavPermissionCoverage.test.js` for the regression test that
locks this in.
