# SCOMS Mobile Architecture

Two React Native (CLI, TypeScript) apps — `scoms-app-student/` and `scoms-app-staff/` —
plus one small backend addition, `scoms-app-backend/`. Everything else (the four
existing web backends, the web frontends, the Postgres database, the `shared/`
package) is unchanged and unaware the mobile apps exist.

```
Student App (scoms-app-student)     Staff App (scoms-app-staff)
        |                                    |
        +------------------+-----------------+
                           |
              Mobile Gateway (scoms-app-backend, port 5005)
             /api/v1/mobile/student   /api/v1/mobile/staff
                           |
        (reuses, unmodified)         (mobile-only addition)
        Student_Backend routers      pushNotifications module
        Staff_backend routers        (own Prisma client)
                           |
                    shared/ (auth, RBAC, module registry,
                    notifications, Prisma client)
                           |
                      PostgreSQL (one database)
```

## 1. Why a mobile gateway exists

The web app already talks to `Student_Backend` (port 5004) and `Staff_backend`
(port 5003) directly, and still does — nothing about them changed. `scoms-app-backend`
is a *third* process that both mobile apps talk to instead. Its `src/app.js` does not
reimplement anything: it `require()`s `Student_Backend/src/routes/apiRoutes.js` and
`Staff_backend/src/routes/apiRoutes.js` verbatim and mounts them under
`/api/v1/mobile/student` and `/api/v1/mobile/staff`. Same controllers, same
`shared/database/client.js` Prisma instance, same auth/RBAC/tenant middleware as the
web app — a mobile request and a web request hit identical business logic.

The only code that actually lives in `scoms-app-backend` is genuinely mobile-only:
push-notification device-token registration (see §4). Everything else — attendance,
homework, exams, fees, library, transport, hostel, fee desk, exam setup, placement —
is the existing web API, reused as-is.

## 2. Why `scoms-app-backend` has its own Prisma schema

`scoms-app-backend/prisma/schema.prisma` is a full copy of the root
`prisma/schema.prisma` (same models, same `DATABASE_URL`, same tables — not a
separate database), with one difference: its `generator client` block points at
`src/generated/prisma-client` instead of the root's `node_modules/.prisma/client`.
This means regenerating this folder's client (`npm run prisma:generate` inside
`scoms-app-backend/`) never fights over a file lock with whatever else has the root
client's query-engine `.dll`/`.so` open — the two clients are independent processes'
copies of the same schema, always kept in sync by copying the file, not by diverging.

`scoms-app-backend/src/database/client.js` exports this folder's own `PrismaClient`
instance. Only the mobile-only `pushNotifications` module uses it — the reused
Student/Staff routers keep using their own `shared/database/client.js` instance via
their own `require('../../../shared')`, unchanged.

## 3. Module-based folder structure

Both RN apps and the mobile gateway follow the same convention: one folder per
feature, not one giant `screens/`/`routes/`/`controllers/` folder.

RN app (`scoms-app-student/src/`, `scoms-app-staff/src/`):
```
modules/<name>/
  screens/     — React Native screens
  services/    — API calls for this module (axios via services/api/client.ts)
```
Backend (`scoms-app-backend/src/`):
```
modules/<name>/
  routes.js       — Express router
  controller.js   — thin HTTP layer (no Prisma calls)
  service.js      — all Prisma queries for this module
  sender.js, internalRoutes.js — module-specific extras, only where needed
```

Shared UI (`components/`), navigation (`navigation/`), auth state (`store/AuthContext.tsx`),
theme (`constants/theme.ts`) and the API client (`services/api/client.ts`) sit outside
`modules/` in both apps, same as the web frontends' `components/`/`context/`/`services/`.

## 4. Authentication

Reused as-is from `shared/auth/`: unified login (`identifier` + `password`, matching
email/mobile/admissionNumber/employeeCode), JWT access token (`JWT_ACCESS_EXPIRES`,
default 1d) + JWT refresh token (`JWT_REFRESH_EXPIRES`, default 7d, DB-backed via the
`RefreshToken` table, rotated on every `/auth/refresh` call).

Mobile-side (`services/api/client.ts` in each app):
- Tokens stored via `react-native-keychain` (`utils/secureStorage.ts`), never
  AsyncStorage/plain storage.
- An axios request interceptor attaches `Authorization: Bearer <accessToken>`.
- A response interceptor catches 401, calls `/auth/refresh` once (de-duped via a
  shared in-flight promise so concurrent 401s don't each trigger their own refresh),
  retries the original request, and force-logs-out if the refresh itself fails.
- `store/AuthContext.tsx` bootstraps from stored tokens on app start by calling
  `/auth/me`, which also returns `institution.enabledModules` — the same dual-path
  module-registry resolver (`shared/moduleRegistry/resolveModules.js`) the web app
  uses, so mobile nav visibility can never disagree with what a route actually allows.

## 5. Dynamic role-based navigation (Staff app)

`scoms-app-staff/src/navigation/roleNavigation.ts` exports
`resolveStaffTabs(role, enabledModules)`, a pure function mapping a staff role to its
tab set, then filtering out any tab whose backing module isn't enabled for that
institution. `MainTabNavigator.tsx` builds its `<Tab.Screen>` list from this at
render time — nothing hardcoded.

| Role | Tabs |
|---|---|
| Teacher / HOD / Principal / Vice Principal / Staff | Home, Attendance, Homework, Examination, More |
| Librarian | Home, Library, More |
| Transport Manager | Home, Transport, More |
| Accountant | Home, FeeDesk, More |
| Hostel Warden | Home, Hostel, More |
| Exam Admin | Home, ExamSetup, More |
| Placement Officer | Home, Placement, More |
| any other role | Home, More |

**This is display-only.** Every route behind every one of these tabs is independently
re-checked by `requireModule()`/`shadowPermission()` on the backend — a role never
gets access to a tab's data just because the tab happened to render.

## 6. Push notifications

- `DeviceToken` model (userId, institutionId, token, platform, timestamps) — lives
  only in `scoms-app-backend`'s Prisma schema/client, reached by every other backend
  only over an internal HTTP call (never a direct Prisma relation), so the model never
  needed to be added to the root schema.
- `POST /api/v1/mobile/{student,staff}/notifications/device-token` (register) and
  `DELETE .../device-token` (unregister) — mounted as a fall-through router *after*
  the reused Student/Staff routers at the same URL prefix, so it inherits
  `req.user`/`req.institutionId` from those routers' own `requireAuth`/`requireTenant`
  middleware without duplicating it.
- Both RN apps call these via `hooks/usePushRegistration.ts`, mounted once near the
  app root: on login it asks for notification permission (incl. Android 13+
  `POST_NOTIFICATIONS`), gets an FCM token via `@react-native-firebase/messaging`'s
  modular API, registers it, re-registers on token refresh, and unregisters on logout.
- `shared/utils/notificationCenter.js`'s `pushNotification()`/`pushNotificationToMany()`
  — called from every existing backend, web included, whenever something writes an
  in-app `Notification` row — now also fires a fire-and-forget `POST
  /internal/push/dispatch` to the mobile gateway (shared-secret authenticated via
  `INTERNAL_PUSH_SECRET`, never end-user JWT). That route looks up device tokens for
  the given user ids and sends the push via `scoms-app-backend/src/modules/
  pushNotifications/sender.js`.
- `sender.js` follows the exact same real/simulated pattern as
  `shared/utils/notifications.js` (email/SMS/WhatsApp): with no
  `FIREBASE_SERVICE_ACCOUNT_JSON` configured, every push is logged as simulated
  instead of failing; paste in a real Firebase service account JSON and it goes live
  with no code change.

## 7. Ports & environment

| Service | Port | .env var |
|---|---|---|
| Super Admin Backend | 5001 | `SUPER_ADMIN_PORT` |
| Institute Admin Backend | 5002 | `INSTITUTE_ADMIN_PORT` |
| Staff Backend (web) | 5003 | `STAFF_PORT` |
| Student Backend (web) | 5004 | `STUDENT_PORT` |
| **Mobile Gateway** | **5005** | **`MOBILE_PORT`** |

Mobile-specific env vars (see `.env.example`): `MOBILE_BACKEND_INTERNAL_URL`,
`INTERNAL_PUSH_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`.

`npm run dev` at the repo root now starts all five backends (including the mobile
gateway) concurrently; `npm run start:mobile` starts just the gateway.

## 8. Known gaps / follow-ups

- **iOS native linking** — `@react-native-firebase/*` and
  `react-native-vector-icons`' fonts still need their `.ttf`/config added to each
  Xcode project's Copy Bundle Resources on a Mac; this repo can wire the
  `Info.plist`/Android Gradle side but can't touch the `.xcodeproj` from Windows.
  Each app's `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
  must come from your own Firebase project — none are checked into this repo.
- **Razorpay native SDK** — `react-native-razorpay` is installed and the fee-payment
  flow's code path for a *real* (non-simulated) gateway is written, but opening an
  actual Checkout UI needs the native module linked and a real Razorpay key
  configured; with the repo's default test keys, the flow auto-verifies via the
  backend's simulated-gateway pair instead (see `Fees` module).
- **RBAC enforcement** — `RBAC_ENFORCEMENT_ENABLED=true` in the current `.env`; the
  matrix is validated by `test/mobileTenantIsolation.test.js` and
  `test/rbacMatrix.test.js`, but the original shadow-mode code comments still note
  only Teacher/Institute Admin were exercised with real production traffic before
  this mobile work — worth a final human review per role before go-live.
