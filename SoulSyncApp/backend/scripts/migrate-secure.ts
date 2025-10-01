import { logger } from './logger'
import { pool } from "../src/db";

async function run() {
  try {
    logger.info("🔧 Running secure migrations...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        used_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_reset_user ON password_resets(user_id);
    `);
    logger.info("✅ Secure migrations complete.");
    process.exit(0);
  } catch (e) {
    logger.error("❌ Migration failed", e);
    process.exit(1);
  }
}
run();
