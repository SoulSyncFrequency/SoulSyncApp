import pino from 'pino'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import rfs from 'rotating-file-stream'

const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs')
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true })

const rotate = rfs.createStream('app-%DATE%.log', {
  path: LOG_DIR,
  size: '10M',
  interval: '1d',
  compress: 'gzip'
})

export const logger = pino({
  redact: ['req.headers.authorization','req.body.password',/token/i,/secret/i,/key/i],
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined
}, rotate as any)
