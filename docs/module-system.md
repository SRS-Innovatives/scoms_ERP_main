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

## Mobile-side usage

Both apps read `user.institution.enabledModules` from `AuthContext` and use it purely
for **display** decisions — which dashboard cards or nav tabs to render:

- Student app: `isModuleEnabled()` inline in `DashboardScreen.tsx`.
- Staff app: `roleNavigation.ts`'s `resolveStaffTabs(role, enabledModules)` — see
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
`resolveStaffTabs` being cross-checked against `shared/permissions/permissionMatrix.js`,
and `test/staffNavPermissionCoverage.test.js` for the regression test that
locks this in.
