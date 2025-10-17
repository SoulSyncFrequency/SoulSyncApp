// src/utils/logger.ts
/* Minimal logger; if pino available, use it */
let pino: any = null
try { pino = require('pino') } catch {}
const base = pino ? pino({ level: process.env.LOG_LEVEL || 'info' }) : null
export const logger = base || {
  info: console.log.bind(console, '[info]'),
  warn: console.warn.bind(console, '[warn]'),
  error: console.error.bind(console, '[error]'),
  debug: (...a:any[])=> { if((process.env.LOG_LEVEL||'').includes('debug')) console.log('[debug]', ...a) }
}
