export const config = {
  ENABLE_METRICS: process.env.ENABLE_METRICS==='1',
  REQUIRE_MFA: process.env.REQUIRE_MFA==='1',
  USE_REDIS: !!process.env.REDIS_URL,
  LOG_JSON: process.env.LOG_JSON==='1',
  IDEMPOTENCY_OFF_PATHS: (process.env.IDEMPOTENCY_OFF_PATHS||'').split(',').map(s=>s.trim()).filter(Boolean),
  HSTS: process.env.HSTS!=='0',
  COMPRESSION: process.env.COMPRESSION!=='0'
}
