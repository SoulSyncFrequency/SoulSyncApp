-- 2025-09-13: Ensure refresh_tokens stores only token_hash
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='refresh_tokens' AND column_name='token'
  ) THEN
    ALTER TABLE refresh_tokens DROP COLUMN token;
  END IF;
  -- Ensure index on token_hash
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='refresh_tokens' AND indexname='idx_refresh_tokens_token_hash'
  ) THEN
    CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
  END IF;
END $$;
