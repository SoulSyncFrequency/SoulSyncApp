import type { Request, Response, NextFunction } from 'express'

const DEFAULT_LIMIT = Number(process.env.CONCURRENCY_LIMIT || 5)
const ENABLED = process.env.ENABLE_CONCURRENCY_LIMIT === 'true'

const counters = new Map<string, number>()

export function concurrencyLimit(limit = DEFAULT_LIMIT) {
  return function limitMw(req: Request, res: Response, next: NextFunction) {
    if (!ENABLED) return next()
    const key = req.route?.path || req.path
    const current = counters.get(key) || 0
    if (current >= limit) {
      return res.status(429).json({ message: 'Too many concurrent requests' })
    }
    counters.set(key, current + 1)
    res.on('finish', () => {
      const now = counters.get(key) || 1
      counters.set(key, Math.max(0, now - 1))
    })
    next()
  }
}
