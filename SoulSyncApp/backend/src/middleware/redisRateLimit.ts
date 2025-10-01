import { Request, Response, NextFunction } from 'express'
let RateLimiterRedis: any = null
let IORedis: any = null
try{ RateLimiterRedis = require('rate-limiter-flexible').RateLimiterRedis }catch{}
try{ IORedis = require('ioredis') }catch{}

export function redisRateLimit(points: number, duration: number){
  let unhealthy = false
  const fail = (e:any)=>{ unhealthy = true }

  if(!RateLimiterRedis || !IORedis || !process.env.REDIS_URL){
    // noop if not available
    return (_req: Request, _res: Response, next: NextFunction)=> next()
  }
  const client = new IORedis(process.env.REDIS_URL)
  client.on('error', fail)
  client.on('end', ()=>{ unhealthy = true })
  const limiter = new RateLimiterRedis({ storeClient: client, keyPrefix: 'rl', points, duration })
  const fallback = (()=>{ try{ const limit = require('express-rate-limit'); return limit.rateLimit({ windowMs: duration*1000, max: points, standardHeaders: true, legacyHeaders: false }) }catch{ return (_req:Request,_res:Response,next:NextFunction)=> next() } })()
  return async (req: Request, res: Response, next: NextFunction)=>{ if(unhealthy) return (fallback as any)(req,res,next)

    const key = (req.headers['x-api-key'] as string) || (req as any).requestId || req.ip || 'anon'
    try{ await limiter.consume(key); return next() }
    catch(_e:any){ return res.status(429).json({ ok:false, code:'rate_limited', message:'Too many requests' }) }
  }
}
