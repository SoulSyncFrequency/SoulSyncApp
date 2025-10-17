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

export function accountLimiter(prefix='login', max=10, windowSec=60){
  return async (req: Request, res: Response, next: NextFunction) => {
    try{
      const email = (req.body && (req.body.email || req.body.username)) || 'unknown'
      const key = `${prefix}:${email}`
      const c = getClient()
      if (!c) return next() // no redis -> skip
      const incr = await c.incr(key)
      if (incr === 1){ await c.expire(key, windowSec) }
      if (incr > max){
        return res.status(429).json({ error: { code:'rate_limited', message:'Too many attempts, slow down.' } })
      }
      return next()
    }catch(e){
      return next()
    }
  }
}
