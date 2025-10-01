
-- prisma migration: apikey_tiers
-- Adds tiering/quotas/scopes/expiry to ApiKey table and enum.
DO $$ BEGIN
  CREATE TYPE "ApiKeyTier" AS ENUM ('FREE','STARTER','PRO','ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "tier" "ApiKeyTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "rpm" INT NOT NULL DEFAULT 60;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "dailyCap" INT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;
-- Prisma emulates String[] via separate table in some providers; if native array is supported use below:
DO $$ BEGIN
  ALTER TABLE "ApiKey" ADD COLUMN "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION WHEN duplicate_column THEN null; END $$;
