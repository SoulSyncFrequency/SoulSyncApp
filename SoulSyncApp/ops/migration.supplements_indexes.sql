
-- Indexes to speed up common queries
CREATE INDEX IF NOT EXISTS idx_supplementdose_user_plan_ts ON "SupplementDose"("userId","planId","ts");
CREATE INDEX IF NOT EXISTS idx_supplementplan_user_type_status ON "SupplementPlan"("userId","type","status","createdAt");
