import { Request, Response, NextFunction } from 'express'
import { connection as redisConnection } from '../queue/queue'

let _ready = false
let _lastCheck = 0

async function checkReady(): Promise<boolean> {
  const now = Date.now()
  if (now - _lastCheck < 15000) return _ready
  _lastCheck = now
  try {
    // Redis basic status check
    // @ts-ignore
    const ok = !!redisConnection && (redisConnection as any).status === 'ready'
    _ready = ok
  } catch {
    _ready = false
  }
  return _ready
}

export async function readinessGate(req: Request, res: Response, next: NextFunction){
  if (String(process.env.READINESS_GATE||'false') !== 'true') return next()
  // Do not gate health/docs/admin logs for operability
  if (req.path.startsWith('/healthz') || req.path.startsWith('/livez') || req.path.startsWith('/readyz') || req.path.startsWith('/api/docs') || req.path.startsWith('/admin')) {
    return next()
  }
  const ok = await checkReady()
  if (!ok) return res.status(503).json({ error: 'not_ready' })
  next()
}
