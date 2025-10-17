import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger'

export function tracingMiddleware(req: Request, res: Response, next: NextFunction){
  const incoming = (req.headers['x-request-id'] as string) || ''
  const traceId = incoming || randomUUID()
  ;(req as any).traceId = traceId
  res.setHeader('x-trace-id', traceId)
  // attach to logger for this request if pino-http not already adding
  (req as any).log = (req as any).log || logger
  try {
    ;(req as any).log = (req as any).log.child({ traceId })
  } catch {}
  next()
}
