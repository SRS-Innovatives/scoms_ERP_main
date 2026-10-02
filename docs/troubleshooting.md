# Troubleshooting (Mobile)

Real issues hit while building this, and how they were resolved — kept here so the
same debugging isn't repeated.

## `EPERM: operation not permitted, rename ...query_engine-windows.dll.node`

Happens running `npx prisma generate` on Windows while another process (a running
backend, an editor extension, sometimes antivirus) still has the previous query
engine `.dll` open. Prisma can't replace a file that's in use.

- Stop every running backend process (`start:student`, `start:staff`, `npm run dev`,
  etc.) in every terminal, then retry.
- This is exactly why `scoms-app-backend` generates its Prisma client to its own
  path (`src/generated/prisma-client`) instead of the shared root
  `node_modules/.prisma/client` — see `docs/database.md`. Generating *that* copy
  never collides with the root one.

## `prisma migrate dev` refuses to run: "non-interactive environment"

`migrate dev` requires an interactive terminal (it can prompt for a migration
name/confirmation). In a script/CI/agent shell, use the
`migrate diff` + manual folder + `migrate deploy` workflow instead — see
`docs/database.md`.

## Android emulator can't reach the backend (`Network Error` on login)

`localhost` inside the Android emulator refers to the emulator itself, not your
host machine. Both apps' `src/constants/config.ts` already special-case this
(`10.0.2.2` on Android), but a **physical device** needs your machine's real LAN IP
instead — see `docs/deployment.md`.

## A tab/button 403s for a role that should have access

Don't guess — cross-check the exact permission the route requires
(`shadowPermission(PERMISSIONS.X)` in the relevant `apiRoutes.js`) against that
role's real grants in `shared/permissions/permissionMatrix.js`. This exact class of
bug was found during a deliberate review (see `docs/mobile-architecture.md`'s RBAC
note): Principal/Vice Principal/Staff were originally given Attendance/Homework
tabs they had no permission for, and Teacher/HOD were given a Publish button they
had no permission for. `test/staffNavPermissionCoverage.test.js` now catches this
class of regression automatically — run `npm test` after changing any role→tab
mapping or adding a new gated call to a screen.

## RBAC seems to let something through it shouldn't (or vice versa)

Check `RBAC_ENFORCEMENT_ENABLED` in `.env` first — when `false`, `shadowPermission`
only audit-logs a would-be-deny (`AuditLog`, module `RBAC_SHADOW`) and lets the
request through anyway. `test/rbacMatrix.test.js` forces enforcement on
(`process.env.RBAC_ENFORCEMENT_ENABLED = 'true'`) *inside that test process only* —
it never touches the real `.env` or a running server.

## Push notifications aren't arriving on a real device

Expected until `FIREBASE_SERVICE_ACCOUNT_JSON` is set to a real service account —
until then every push is intentionally simulated (logged, not dispatched), same as
the email/SMS/WhatsApp channels. Check the mobile gateway's own log for
`🔔 [SIMULATED PUSH SENT]` to confirm the dispatch call actually arrived; if you
don't see that line at all, check `INTERNAL_PUSH_SECRET` matches between whichever
backend fired `pushNotification()`/`pushNotificationToMany()` and the gateway.

## Fee payment "Pay Now" doesn't open a real checkout screen

Expected with the repo's default placeholder Razorpay keys — the backend runs in
simulated-gateway mode and the mobile screen auto-verifies with the precomputed
pair instead of opening a UI. Configure real `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`
and link `react-native-razorpay` natively to see the real widget. See
`docs/student-app.md`'s fee-payment flow section.

## TypeScript can't find types for a native module

`@types/react-native-vector-icons` and `@types/react-native-razorpay` are
separate `devDependencies` from the packages themselves — installing the package
alone isn't enough if it doesn't ship its own `.d.ts`. Check first with
`npm view @types/<package-name> versions` before writing a manual
`declare module` fallback.
