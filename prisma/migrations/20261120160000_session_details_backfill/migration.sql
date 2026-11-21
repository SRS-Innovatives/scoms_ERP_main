-- Sessions from before session details were recorded: their honest "last active" is when
-- they signed in (the column default stamped them with the migration time instead).
UPDATE "RefreshToken" SET "lastUsedAt" = "createdAt" WHERE "portal" IS NULL;
