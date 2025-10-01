import type { Request, Response, NextFunction } from 'express'

const ENABLED = process.env.ENABLE_LOG_SAMPLING === 'true'
const RATE = Math.max(0, Math.min(1, Number(process.env.LOG_SAMPLING_RATE || 0.01)))
const SLOW = Number(process.env.SLOW_REQ_THRESHOLD_MS || 500)

export function logSampling(req: Request, res: Response, next: NextFunction) {
  if (!ENABLED) return next()
  const start = Date.now()
  const shouldSample = Math.random() < RATE

  // Re-wire res to decide after finish
  res.on('finish', () => {
    const ms = Date.now() - start
    const status = res.statusCode
    const isError = status >= 500
    const isSlow = ms >= SLOW
    if (isError || isSlow || shouldSample) {
      const userId = (req as any).user?.id || (req as any).session?.userId || 'anon'
      const msg = isError ? 'sampled_error' : isSlow ? 'sampled_slow' : 'sampled_normal'
      req.log?.info?.({ ms, status, method: req.method, path: req.path, userId }, msg)
    }
  })
  next()
}
