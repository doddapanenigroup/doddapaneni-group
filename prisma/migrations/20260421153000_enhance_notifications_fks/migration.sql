-- Safe additive migration: new columns, backfill, indexes, FKs (no drops of models or columns).

-- Notification: add message, read
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;

UPDATE "notification" SET "read" = true WHERE "read_at" IS NOT NULL AND "read" = false;
UPDATE "notification" SET "message" = LEFT("title", 2000) WHERE "message" IS NULL;

CREATE INDEX IF NOT EXISTS "notification_user_id_read_idx" ON "notification"("user_id", "read");

-- Optional: new deployment rows use random UUID text (legacy cuid ids unchanged)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deployment') THEN
    ALTER TABLE "deployment" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid()::text);
  END IF;
END $$;

-- Orphan rows: visits/logs may reference users that were removed before FKs existed.
-- Required so ADD CONSTRAINT ... REFERENCES "User" succeeds.
DELETE FROM "ContentEditLog" e
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = e."user_id");

DELETE FROM "MarketingActivityLog" m
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = m."user_id");

DELETE FROM "DashboardVisit" d
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = d."user_id");

UPDATE "ErrorLog" el SET "user_id" = NULL
WHERE el."user_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = el."user_id");

UPDATE "WebVitalReport" w SET "user_id" = NULL
WHERE w."user_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = w."user_id");

-- Foreign keys to User (PascalCase table names from initial migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentEditLog_userId_fkey') THEN
    ALTER TABLE "ContentEditLog" ADD CONSTRAINT "ContentEditLog_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MarketingActivityLog_userId_fkey') THEN
    ALTER TABLE "MarketingActivityLog" ADD CONSTRAINT "MarketingActivityLog_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DashboardVisit_userId_fkey') THEN
    ALTER TABLE "DashboardVisit" ADD CONSTRAINT "DashboardVisit_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ErrorLog_userId_fkey') THEN
    ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebVitalReport_userId_fkey') THEN
    ALTER TABLE "WebVitalReport" ADD CONSTRAINT "WebVitalReport_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "DashboardVisit_user_id_visited_at_idx" ON "DashboardVisit"("user_id", "visited_at");
