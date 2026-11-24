# Student App (`scoms-app-student/`)

React Native CLI, TypeScript. Talks to the mobile gateway at
`/api/v1/mobile/student` (see `docs/mobile-architecture.md`, `docs/mobile-api.md`).

## Navigation

Navigation is built from **App Module Access** (Super Admin → Institutions → App
Module Access), not hard-coded. After login the app calls `GET /app-modules`
(`src/store/AppModulesContext.tsx`) and `src/navigation/moduleRegistry.tsx` turns the
visible modules into:

```
Home  ·  <first 3 visible tab-eligible modules>  ·  More
```

Everything else that's visible goes into `More` (`src/navigation/MoreNavigator.tsx`),
followed by the always-present Notifications and Profile. With everything visible this
is the same layout as before: Home · Attendance · Timetable · Homework · More, with Fees,
Examinations and Certificates in More. If Attendance is hidden, Fees moves up into its tab.

- **Adding a module screen:** add its key to `src/navigation/moduleKeys.ts` (must exist in
  `shared/appModules/catalog.js`; `test/appModuleVisibility.test.js` checks this), its
  screen name to `ModuleScreenName` in `types.ts`, and one entry to `MODULE_REGISTRY`.
- **Refresh:** the list re-loads when the app returns to the foreground, on dashboard
  pull-to-refresh, and whenever the gateway answers `403 APP_MODULE_HIDDEN`, so a Super
  Admin change shows without re-login. A screen open at that moment shows
  `ModuleUnavailableView` until navigation drops it.
- **Fallback:** if `/app-modules` can't be loaded, visibility falls back to
  `institution.enabledModules` from `/auth/me` (`LEGACY_REQUIRES`).

`RootNavigator.tsx` swaps between `AuthNavigator` (Login, Forgot Password) and
`MainTabNavigator` based on `useAuth().isAuthenticated`.

## Parent mode

Same app, `PARENT` role. `src/store/ParentContext.tsx`:

- Loads the linked children from `GET /parent/children` (`/auth/me` doesn't return
  them, so this survives an app restart).
- Remembers the active child per parent account in AsyncStorage.
- `apiClient` sends `X-Active-Student-Id` on every request; the backend's
  `resolveActiveChild` verifies the link. It's not sent on `/parent/children` itself, so a
  stale saved id can't block recovery.
- Switching child removes every cached query except `appModules` / `parentChildren`, so
  one child's data never shows under another child's name.
- `RootNavigator` shows `ChildPickerScreen` (2+ children, none chosen),
  `ParentStatusScreen` (no child linked / load error), otherwise the main tabs.
- Every header shows `ChildHeaderChip` (tap to switch), the dashboard shows a "Viewing"
  card, and `ChildSwitcherSheet` is the bottom-sheet switcher. Parent View uses the violet
  `colors.parent` accent throughout; students get indigo.

### What parents can and can't do

- **Blocked on the server** (`blockParentWrite`): submitting homework, anonymous course
  feedback, applying to placements, attendance correction requests, event registration,
  and joining clubs. The app also hides the homework Submit button and shows a note.
- **Own account:** `GET`/`PATCH /parent/profile` (`parentController`). A parent may edit
  contact fields only: phones, emails, occupations, guardian and address. Names, income
  and the login ID stay with the school. Screens: Profile → Family details →
  `EditParentProfileScreen`.
- **Parent Corner** (parent-only, read-only, about the active child;
  `parentRecordsController`):

  | App screen | API | Institution module | Written by |
  |---|---|---|---|
  | Discipline | `GET /discipline` | `discipline` | Institute Admin → Student Discipline |
  | Health | `GET /health-records` | `health` | Institute Admin → Health |
  | PTM Notes | `GET /ptm-notes` | `ptm` | Staff → PTM |

  Students get 403. These are listed under "Parent Corner" in More (never as tabs), share
  the `RecordTimeline` layout, and feed the dashboard's "Needs your attention" card
  (open incidents, sick-room visits in the last 7 days).
- **Default visibility:** a module can start hidden for parents until Super Admin turns it
  on (catalog `defaultHiddenFor`); none does today. Study Materials is visible to parents.
- **Permissions:** PARENT holds view-only `assignments.view`, `materials.view` and
  `exams.view`, so Homework, Study Materials and the exam schedule / hall ticket load for
  the active child when RBAC is enforced (production). `test/parentModules.test.js` checks
  that every parent-app read route passes for a parent.
- **Logout** clears the whole query cache, so the next account on the device never sees
  the previous one's data.

### Leave, Notices, Calendar (shared by students and parents)

| Screen | API | Notes |
|---|---|---|
| Leave | `GET /leave/types`, `GET /leave`, `POST /leave` | Built-in date strip and day counter (no native date-picker dependency). The server validates the dates, end ≥ start, and that the type is one of the institution's leave types. A parent applies for the active child. |
| Notices | `GET /announcements`, `GET /circulars` | Two tabs, each fetched only when opened. A parent also receives PARENTS-targeted announcements. |
| Calendar | `GET /academic-calendar?from=&to=` | Month grid with event-type dots, one request per month viewed. Events that overlap the month are included. |
| Study Materials | `GET /materials`, `POST /materials/:id/opened` | Subject chips + search; tap opens the file / link. Only a student's opens are recorded for the teacher. |
| Transport | `GET /transport` | Route, pickup point, bus number, driver (tap to call), today's morning / evening trip status, monthly fee. Only family-facing vehicle fields are returned. |
| Gallery | `GET /gallery/albums`, `GET /gallery/albums/:id/photos` | Album grid (cover is a signed link, not base64), photo grid, full-screen swipe viewer. |

## Visual system

`src/constants/theme.ts`: indigo brand, violet parent accent, one `moduleColors` accent
per module (dashboard tiles, quick access, menu icons), `shadow()` elevation, and
`Avatar` initials with a stable colour per name.

## Modules (`src/modules/<name>/`)

| Module | Screen(s) | Backend routes |
|---|---|---|
| `auth` | Login, Forgot Password | `/auth/*` |
| `dashboard` | Home (widgets: attendance %, pending homework, pending fees, recent notifications), More menu | aggregates several modules below |
| `attendance` | Overall %, present/absent/total | `GET /attendance` |
| `timetable` | Weekly timetable | `GET /timetable` |
| `homework` | Assignment list with due dates + submission status | `GET /assignments`, `POST /assignments/submit` |
| `examination` | Schedule / Results tabs | `GET /exams/schedule`, `GET /exams/results` |
| `fees` | Per-assignment due list → pick amount → pay | `GET /fees`, `POST /fees/pay/initiate`, `POST /fees/pay/verify` |
| `certificates` | Issued certificates list | `GET /certificates`, `GET/POST /certificate-requests` |
| `notifications` | List, mark read/all-read, device-token register/unregister | `GET /notifications*`, `POST/DELETE /notifications/device-token` |
| `profile` | Read-only profile + logout | derived from `/auth/me` |

Dashboard widgets follow `useAppModules().isVisible()` — a widget for a hidden module
isn't rendered and its data isn't fetched (see `docs/module-system.md`).

## Fee payment flow

`FeesScreen.tsx` mirrors the web app's `PayFeesPage.jsx` logic exactly:

1. Pick a due `StudentFeeAssignment`, enter an amount (≤ its `dueAmount`).
2. `POST /fees/pay/initiate` → returns a Razorpay order.
3. If `order.simulated` is `true` (default — no real Razorpay keys configured),
   the backend already precomputed a valid payment id + signature pair, so the
   screen calls `POST /fees/pay/verify` immediately — no checkout UI to open.
4. If `order.simulated` is `false` (real keys configured), the screen opens the
   real `react-native-razorpay` Checkout SDK and verifies with its callback result.

The client never marks a fee paid itself — `/fees/pay/verify` independently
re-checks the Razorpay HMAC signature server-side either way.

## Push notifications

`src/hooks/usePushRegistration.ts`, mounted once in `App.tsx`, registers/unregisters
this device's FCM token on login/logout. See `docs/mobile-architecture.md` §6 for
the full backend-side flow and the native setup still required
(`google-services.json`/`GoogleService-Info.plist` from your own Firebase project).

## Config

`src/constants/config.ts` — `API_BASE_URL` points at the mobile gateway
(`http://10.0.2.2:5005/...` on the Android emulator, `http://localhost:5005/...`
elsewhere). Override the host for a physical device — see `docs/deployment.md`.
