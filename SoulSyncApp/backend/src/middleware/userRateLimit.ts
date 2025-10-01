import type { Request, Response, NextFunction } from 'express'
import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | null = null
function getClient(){
  if (client) return client
  const url = process.env.REDIS_URL
  if (!url) return null
  client = createClient({ url })
  client.connect().catch(()=>{})
  return client
}

/**
 * Per-user limiter using req.user.id (JWT) or fallback key param
 */
export function userRateLimit(prefix='user', max=120, windowSec=60){
  return async (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user
    const id = (u && (u.id || u.sub)) || null
    const key = id ? `${prefix}:${id}` : null
    const c = getClient()
    if (!c || !key) return next()
    try{
      const n = await c.incr(key)
      if (n === 1) await c.expire(key, windowSec)
      res.setHeader('X-RateLimit-Limit', String(max))
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - n)))
      res.setHeader('X-RateLimit-Reset', String(Math.floor((Date.now() + windowSec*1000)/1000)))
      if (n > max){
        res.setHeader('Retry-After', String(windowSec))
        return res.status(429).json({ error: { code:'rate_limited', message:'Too many requests for this user' } })
      }
    } catch {}
    next()
  }
}
