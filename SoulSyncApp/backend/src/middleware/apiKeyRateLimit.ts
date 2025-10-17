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

export function apiKeyRateLimit(prefix='apikey', max=120, windowSec=60){
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).apiKey?.id || 'unknown'
    const c = getClient()
    if (!c) return next()
    try{
      const rkey = `${prefix}:${key}`
      const n = await c.incr(rkey)
      if (n === 1) await c.expire(rkey, windowSec)
      if (n > max){
        return res.setHeader('Retry-After','1'); res.setHeader('X-RateLimit-Remaining','0'); res.setHeader('X-RateLimit-Limit', String(tokensPerWindow||0)); res.status(429).json({ error:{ code:'rate_limited', message:'API key rate limit exceeded' } })
      }
    } catch {}
    next()
  }
}
