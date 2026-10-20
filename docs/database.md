# Database (Mobile)

One Postgres database, shared by every backend (web and mobile) and every schema
copy — see `docs/mobile-architecture.md` §2 for why `scoms-app-backend` has its own
`prisma/schema.prisma` file at all (a full copy, not a subset, kept in sync by
copying the file — never a second database).

## The one new table

```prisma
model DeviceToken {
  id            String   @id @default(uuid())
  userId        String
  institutionId String?
  token         String   @unique
  platform      DevicePlatform   // ANDROID | IOS
  createdAt     DateTime @default(now())
  lastSeenAt    DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Added to **both** `prisma/schema.prisma` (root) and
`scoms-app-backend/prisma/schema.prisma` (identical copy). Only
`scoms-app-backend`'s own Prisma client (`src/database/client.js`) ever queries it —
see `docs/mobile-architecture.md` §6 for why the rest of the platform reaches it only
over an internal HTTP call, never a direct Prisma relation.

No other new tables. Every other model the mobile apps read/write already existed
for the web app (`User`, `Student`, `Staff`, `Institution`, `AttendanceSession`/
`AttendanceRecord`, `Assignment`/`AssignmentSubmission`, `Exam`/`ExamSchedule`/
`StudentMark`, the fee-management cluster, `Notification`, `RefreshToken`,
`HostelBed`, `Book`/`BookIssue`, `Vehicle`/`VehicleTrip`, `JobPosting`, ...).

## Running a migration against two schema copies

`prisma migrate dev` is interactive and refuses to run in a non-interactive shell.
The workflow used for the `DeviceToken` migration (repeatable for future schema
changes touched by mobile work):

```bash
# 1. Edit prisma/schema.prisma (root) — add/change models.
# 2. Generate the SQL diff against the LIVE database (no shadow DB needed):
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel ./prisma/schema.prisma --script > /tmp/diff.sql

# 3. Create a real migration folder and drop the diff in:
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_your_migration_name
mv /tmp/diff.sql prisma/migrations/<that folder>/migration.sql

# 4. Apply it (non-interactive safe):
npx prisma migrate deploy

# 5. Regenerate clients:
npx prisma generate                                  # root
cd scoms-app-backend && npx prisma generate           # mobile gateway's own copy
```

Always review the generated `migration.sql` before applying — `migrate diff` can
in principle also emit `DROP`/`ALTER` statements for unrelated drift; the
`DeviceToken` migration's diff was purely additive (one `CREATE TYPE`, one
`CREATE TABLE`, indexes, one FK) and that's the only kind that should ever be
applied without a closer look.

## Why the mobile gateway's client generates to its own path

`scoms-app-backend/prisma/schema.prisma`'s `generator client` block sets
`output = "../src/generated/prisma-client"` instead of the default
`node_modules/.prisma/client`. This means `npx prisma generate` inside
`scoms-app-backend/` never fights the root client's query-engine binary for a file
lock (a real `EPERM: operation not permitted, rename ...query_engine-windows.dll.node`
error hit during this build, caused by another running backend process holding the
root engine file open) — see `docs/troubleshooting.md`.
