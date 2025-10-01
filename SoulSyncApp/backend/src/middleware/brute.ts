import { Request, Response, NextFunction } from 'express'

const attempts = new Map<string, { count: number, ts: number }>()

export function bruteProtect(limit=5, windowMs=15*60*1000){
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const user = (req.body && (req.body.email || req.body.username)) || ''
    const key = `${ip}:${req.path}:${user}`
    const now = Date.now()
    const entry = attempts.get(key) || { count: 0, ts: now }
    if (now - entry.ts > windowMs) { entry.count = 0; entry.ts = now }
    entry.count += 1
    attempts.set(key, entry)
    if (entry.count > limit) {
      return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many attempts. Try later.' } })
    }
    next()
  }
}
