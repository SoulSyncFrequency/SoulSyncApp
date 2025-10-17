import { logger } from './utils/logger'

export function logConfigSummary(){
  const flags = {
    API_KEYS: !!(process.env.ADMIN_API_KEYS || process.env.ADMIN_API_KEY),
    REDIS: !!process.env.REDIS_URL,
    F0_REDIS_CACHE: process.env.F0_REDIS_CACHE === '1',
    VERIFY_SUGGESTIONS: process.env.VERIFY_SUGGESTIONS === '1',
    AI_SUMMARY: !!process.env.OPENAI_API_KEY,
    DS_AI_COLUMNS: process.env.DS_AI_COLUMNS === '1',
    S3: !!process.env.DS_S3_BUCKET,
    OTEL: !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  }
  logger.info({ flags }, 'startup_config_summary')
}
