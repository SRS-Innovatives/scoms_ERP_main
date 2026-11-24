# Running & Building the Mobile System

## Backend — dev

```bash
npm install                # repo root — installs/links every workspace, incl. scoms-app-backend
npm run dev                 # starts all 5 backends concurrently, incl. the mobile gateway (5005)
# or just the mobile gateway:
npm run start:mobile
```

Required env vars (root `.env`, see `.env.example` for every value):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection — same DB for every backend |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | required at startup, no insecure fallback |
| `MOBILE_PORT` | mobile gateway port, default `5005` |
| `MOBILE_BACKEND_INTERNAL_URL` | where other backends reach the gateway's push-dispatch route, default `http://localhost:5005` |
| `INTERNAL_PUSH_SECRET` | shared secret for that internal call — never sent to any client |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | real Firebase service account JSON (single-line) to send *live* push instead of simulated |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | real keys to open a live Razorpay Checkout instead of the simulated auto-verify path |

## Mobile apps — dev

```bash
cd scoms-app-student   # or scoms-app-staff
npm install
npx react-native run-android   # or run-ios (needs a Mac)
```

`src/constants/config.ts` in each app picks the API host by platform:
- Android emulator → `10.0.2.2` (the emulator's alias for the host machine)
- iOS simulator → `localhost`
- **Physical device** → edit `DEV_HOST` to your machine's real LAN IP
  (e.g. `192.168.1.20`) — `localhost`/`10.0.2.2` won't resolve from a real phone.

## Mobile apps — production

- **API:** the single Render service (`server/server.js`) serves the mobile apps too —
  `/api/v1/mobile/{student,staff}/*` from `scoms-app-backend/src/mobileRoutes.js`, mounted in
  `server/app.js`. No separate gateway service is needed. Push is delivered in-process, so
  `INTERNAL_PUSH_SECRET` / `MOBILE_BACKEND_INTERNAL_URL` are only for the local per-portal
  dev servers.
- **App → server:** release builds use `PRODUCTION_API_ORIGIN` in each app's
  `src/constants/config.ts` (default `https://scoms-erp-main.onrender.com`). **Set it to your
  Render service URL — the same value as `SCOMS_API_URL` in Vercel — before building a
  release.** Debug builds keep using the local gateway (`DEV_HOST`, port 5005).
- **Before publishing to the Play Store:** replace the debug keystore in the `release`
  signing block (see below), and add Firebase (next section) if you want push.

## Android release build

Standard React Native CLI flow — nothing mobile-gateway-specific:
```bash
cd android
./gradlew assembleRelease    # or bundleRelease for an .aab
```
Each app needs its own signing config (`android/app/build.gradle`'s `release`
signing block currently reuses the debug keystore — replace before a real release,
per React Native's own signed-APK docs).

## Firebase (push notifications) setup — required per app, per platform

Not shipped in this repo — create your own Firebase project. **Optional:** without these
files both apps still build and run (Android applies the google-services plugin only when
`google-services.json` exists; the app just skips push registration).

1. console.firebase.google.com → Add project.
2. Add an Android app for `com.scomsstudent`, download `google-services.json`,
   place at `scoms-app-student/android/app/google-services.json`. Repeat for
   `com.scomsstaff` → `scoms-app-staff/android/app/google-services.json`.
3. For iOS: add an iOS app per bundle id, download `GoogleService-Info.plist`, add
   it to the corresponding Xcode project's target (Copy Bundle Resources), and add
   `FirebaseApp.configure()` at the start of `application(_:didFinishLaunchingWithOptions:)`
   in `AppDelegate.swift` (per @react-native-firebase's iOS setup) — needs a Mac.
4. Project Settings → Service Accounts → Generate new private key → paste the
   resulting JSON (single-line) into the backend's `FIREBASE_SERVICE_ACCOUNT_JSON`
   (Render → scoms-api → Environment; the key is already listed in `render.yaml`).

Until step 4, every push is logged as simulated instead of failing — see
`docs/mobile-architecture.md` §6.

## Vector icons (Android)

Already wired — `android/app/build.gradle` in both apps applies
`react-native-vector-icons/fonts.gradle`, so a rebuild picks up every font
automatically. iOS needs the `.ttf` manually added to Xcode's Copy Bundle Resources
(a Mac-only step); `Info.plist`'s `UIAppFonts` entry is already in place for
`MaterialIcons.ttf`.

## Ports

| Service | Port |
|---|---|
| Super Admin Backend | 5001 |
| Institute Admin Backend | 5002 |
| Staff Backend (web) | 5003 |
| Student Backend (web) | 5004 |
| **Mobile Gateway** | **5005** |
