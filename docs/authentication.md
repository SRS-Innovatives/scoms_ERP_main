# Mobile Authentication

Both mobile apps reuse the exact same auth backend the web apps use
(`shared/auth/`) — no separate mobile auth system exists. See
`docs/mobile-architecture.md` §4 for the high-level flow; this file covers the
details.

## Login

`POST /auth/login` — body `{ identifier, password }`. `identifier` matches email,
mobile, admission number, or employee code (`shared/auth/unifiedAuth.js`). Returns:

```json
{
  "user": { "id", "email", "role", "institutionId", "institution": { "enabledModules": [...] }, "student|staff": {...} },
  "accessToken": "...",
  "refreshToken": "...",
  "redirectUrl": "/student/dashboard"
}
```

`redirectUrl` is a web-app path and unused by the mobile apps — they route based on
`isAuthenticated` alone (see `navigation/RootNavigator.tsx` in each app).

## Token lifetime & storage

- Access token: `JWT_ACCESS_EXPIRES` (default `1d`).
- Refresh token: `JWT_REFRESH_EXPIRES` (default `7d`), backed by a `RefreshToken` DB
  row, rotated (old row deleted, new one created in the same transaction) on every
  `/auth/refresh` call.
- Mobile storage: `react-native-keychain`, one service name per app
  (`scoms.student.auth` / `scoms.staff.auth`) — see each app's
  `src/utils/secureStorage.ts`. Never AsyncStorage, never plain-text.

## Request/refresh flow (`src/services/api/client.ts` in each app)

1. Every request gets `Authorization: Bearer <accessToken>` from an axios request
   interceptor that reads the stored token.
2. On a `401` response, a response interceptor:
   - De-dupes concurrent refreshes via a single shared in-flight promise.
   - Calls `/auth/refresh` with the stored refresh token, using a *separate* axios
     instance with no interceptors (so a 401 on the refresh call itself can't loop).
   - On success: saves the new token pair, retries the original request once.
   - On failure: clears stored tokens and calls the app's registered
     "session expired" handler, which `store/AuthContext.tsx` wires to force a
     logout (drops back to the login screen).

## Session bootstrap

`AuthProvider` (`src/store/AuthContext.tsx`) on mount:
1. Reads stored tokens.
2. If present, calls `GET /auth/me` to rehydrate the full user object (including
   `institution.enabledModules` — see `docs/module-system.md`).
3. If that call fails (expired/invalid refresh token, and the retry above also
   failed), clears storage and shows the login screen.

## Forgot password (OTP)

Three-step flow, identical to the web app (`shared/auth/passwordReset.js`):

| Step | Endpoint | Body |
|---|---|---|
| 1. Request code | `POST /auth/forgot-password` | `{ identifier }` |
| 2. Verify code | `POST /auth/verify-otp` | `{ identifier, otp }` |
| 3. Reset | `POST /auth/reset-password` | `{ identifier, otp, newPassword }` |

Step 1 always returns the same generic message whether or not the account exists
(no enumeration). Step 3 invalidates every refresh token for that user — a password
reset forces re-login on all devices, mobile included.

## Logout

`AuthContext.logout()` calls `POST /auth/logout` with the stored refresh token
(deletes that one row server-side), then clears local storage regardless of whether
the network call succeeded. `usePushRegistration` (see
`docs/mobile-architecture.md` §6) also unregisters the device's push token on the
same logout transition.

## What the mobile client never controls

`userId`, `institutionId`, and `role` all come from the verified JWT
(`requireAuth`/`requireTenant` middleware), never from a request body or query
param. See `test/mobileTenantIsolation.test.js` for the automated proof.
