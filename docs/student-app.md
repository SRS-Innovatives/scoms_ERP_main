# Student App (`scoms-app-student/`)

React Native CLI, TypeScript. Talks to the mobile gateway at
`/api/v1/mobile/student` (see `docs/mobile-architecture.md`, `docs/mobile-api.md`).

## Navigation

Bottom tabs (`src/navigation/MainTabNavigator.tsx`), fixed for every student —
students don't have the role-based nav variability staff do:

```
Home  ·  Attendance  ·  Timetable  ·  Homework  ·  More
```

`More` (`src/navigation/MoreNavigator.tsx`, a stack) holds: Examinations, Fees,
Certificates, Notifications, Profile.

`RootNavigator.tsx` swaps between `AuthNavigator` (Login, Forgot Password) and
`MainTabNavigator` based on `useAuth().isAuthenticated`.

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

Dashboard widgets and the Fees list respect `institution.enabledModules` — a widget
for a disabled module simply doesn't render (see `docs/module-system.md`).

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
