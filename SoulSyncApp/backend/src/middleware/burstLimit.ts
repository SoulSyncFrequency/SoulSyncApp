import type { Request, Response, NextFunction } from 'express'

const ENABLED = process.env.ENABLE_BURST_LIMIT === 'true'
const LIMIT = Math.max(1, Number(process.env.BURST_LIMIT || 10))
const WINDOW = Math.max(100, Number(process.env.BURST_WINDOW_MS || 10_000))

type Bucket = { tokens: number; updatedAt: number }
const buckets = new Map<string, Bucket>()

function keyFrom(req: Request) {
  const user = (req as any).user?.id
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'ip'
  const path = req.route?.path || req.path
  return `${user || 'anon'}|${ip}|${path}`
}

export function burstLimit() {
  return function burstMw(req: Request, res: Response, next: NextFunction) {
    if (!ENABLED) return next()
    const key = keyFrom(req)
    const now = Date.now()
    let b = buckets.get(key)
    if (!b) {
      b = { tokens: LIMIT, updatedAt: now }
      buckets.set(key, b)
    }
    // refill tokens proportional to elapsed time
    const elapsed = now - b.updatedAt
    if (elapsed > 0) {
      const refill = (elapsed / WINDOW) * LIMIT
      b.tokens = Math.min(LIMIT, b.tokens + refill)
      b.updatedAt = now
    }
    if (b.tokens < 1) {
      res.setHeader('Retry-After', Math.ceil(WINDOW / 1000).toString())
      return res.status(429).json({ message: 'Too many requests (burst limit)' })
    }
    b.tokens -= 1
    next()
  }
}
