
CREATE TABLE IF NOT EXISTS "F0Audit" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "inputHash" TEXT NOT NULL,
  "profile" TEXT NOT NULL,
  "params" JSONB NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "safeGate" DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS "F0Audit_createdAt_idx" ON "F0Audit"("createdAt");
