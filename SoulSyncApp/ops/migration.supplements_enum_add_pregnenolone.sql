
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='SupplementType' AND e.enumlabel='PREGNENOLONE') THEN
    ALTER TYPE "SupplementType" ADD VALUE IF NOT EXISTS 'PREGNENOLONE';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
