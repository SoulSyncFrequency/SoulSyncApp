
DO $$ BEGIN
  CREATE TYPE "SupplementType" AS ENUM ('PROGEST_E');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SupplementPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "userId" TEXT NOT NULL,
  "type" "SupplementType" NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Progest-E Plan',
  "params" JSONB NOT NULL,
  "startAt" TIMESTAMPTZ,
  "endAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "consentAt" TIMESTAMPTZ,
  "clinicianOk" BOOLEAN NOT NULL DEFAULT FALSE,
  "notes" TEXT
);
CREATE INDEX IF NOT EXISTS "SupplementPlan_user_type_status_idx" ON "SupplementPlan"("userId","type","status");

CREATE TABLE IF NOT EXISTS "SupplementDose" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "planId" TEXT NOT NULL REFERENCES "SupplementPlan"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "ts" TIMESTAMPTZ NOT NULL,
  "amount" NUMERIC(10,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "note" TEXT,
  "symptoms" JSONB
);
CREATE INDEX IF NOT EXISTS "SupplementDose_user_ts_idx" ON "SupplementDose"("userId","ts");
