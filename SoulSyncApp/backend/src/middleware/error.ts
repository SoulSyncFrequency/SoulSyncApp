import { logger } from '../logger'
import { Sentry } from '../sentry'
import { config } from '../config'
import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../errors'

function genTraceId(){ return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction){
  const traceId = ((req as unknown)?.requestId) || genTraceId()
  let status = 500, message = 'Something went wrong', details: unknown = undefined

  if (err instanceof ApiError){
    status = err.statusCode || 500
    message = err.message || message
    details = err.details
  } else if (err && typeof err === 'object' && 'message' in (err as unknown)) {
    message = (err as unknown).message || message
  }

  if ((err as unknown)?.type === 'entity.too.large') { return res.status(413).json({ error: 'Payload Too Large' }) }
  if ((err as unknown)?.type === 'entity.parse.failed' || (err instanceof SyntaxError)) { if (String(config.PROBLEM_JSON_ERRORS||'false').toLowerCase()==='true'){ res.type('application/problem+json'); return res.status(400).json({ type:'about:blank', title:'Invalid JSON', status:400, requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) } else { return res.status(400).json({ error: 'Invalid JSON', requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) } }
  try { Sentry.captureException(err as unknown) } catch {}
  if ((err as unknown)?.type === 'entity.too.large') { return res.status(413).json({ error: 'Payload Too Large' }) }
  if ((err as unknown)?.type === 'entity.parse.failed' || (err instanceof SyntaxError)) { if (String(config.PROBLEM_JSON_ERRORS||'false').toLowerCase()==='true'){ res.type('application/problem+json'); return res.status(400).json({ type:'about:blank', title:'Invalid JSON', status:400, requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) } else { return res.status(400).json({ error: 'Invalid JSON', requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) } }
  try {
    // Minimal server-side log with traceId
    // eslint-disable-next-line no-console
    logger.error(`[${new Date().toISOString()}] [ERROR] (${traceId})`, err)
  } catch {}

  res.status(status).json({ error: message, details, traceId })
}
