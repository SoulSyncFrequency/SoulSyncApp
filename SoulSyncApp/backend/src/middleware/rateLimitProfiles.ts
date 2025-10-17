import { metricsHooks } from '../routes/metrics.routes'
import { inc } from '../routes/metrics.routes'
import type { Request, Response, NextFunction } from 'express'

type BucketKey = string
const store = new Map<BucketKey,{ tokens:number; ts:number }>()

function allow(key:BucketKey, rate:number, perMs:number){
  const now = Date.now()
  const b = store.get(key) || { tokens: rate, ts: now }
  const elapsed = now - b.ts
  const refill = Math.floor(elapsed / perMs) * rate
  b.tokens = Math.min(rate, b.tokens + refill)
  b.ts = refill ? now : b.ts
  if (b.tokens <= 0) return false
  b.tokens -= 1
  store.set(key, b)
  return true
}

function limiter(rate:number, perMs:number){
  return (req:Request, res:Response, next:NextFunction)=>{
    const ip = req.ip || '0.0.0.0'
    const key = `${ip}:${req.path}:${rate}:${perMs}`
    if(!allow(key, rate, perMs)){
      metricsHooks.rate_limited(); inc('rate_limited_total'); res.status(429).json({ error:{ code:'rate_limited' } })
    } else next()
  }
}

export const rateLimitAuth = limiter(5, 10_000)      // 5 req / 10s
export const rateLimitStrict = limiter(2, 10_000)    // 2 req / 10s
export const rateLimitWebhook = limiter(10, 60_000)  // 10 req / min

/** Optional Redis adapter (if REDIS_URL set). Simple token bucket share. */
let redis:any = null
if(process.env.REDIS_URL){
  try{ const { createClient } = require('redis'); redis = createClient({ url: process.env.REDIS_URL }); redis.connect().catch(()=>{}) }catch{}
}

function allowShared(key:string, rate:number, perMs:number){
  if(!redis) return null
  const now = Date.now()
  const bucket = `rl:${key}:${rate}:${perMs}`
  // Best-effort; not perfectly atomic without LUA, acceptable for low contention here
  return redis.get(bucket).then((val:string|null)=>{
    let tokens = val ? Number(val) : rate
    if(tokens<=0) return false
    tokens -= 1
    const ttl = Math.ceil(perMs/1000)
    return redis.set(bucket, String(tokens), { EX: ttl }).then(()=>true)
  })
}

const lua_script = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local tokens = tonumber(redis.call('GET', key) or capacity)
if tokens <= 0 then return 0 end
tokens = tokens - 1
redis.call('SET', key, tokens, 'EX', ttl)
return tokens
`
async function allowSharedAtomic(key:string, rate:number, perMs:number){
  if(!redis) return null
  const ttl = Math.ceil(perMs/1000)
  try{
    const rem = await redis.eval(lua_script, { keys:[`rl:${key}:${rate}:${perMs}`], arguments:[String(rate), String(ttl)] })
    if(rem===0) return false
    return true
  }catch{ return null }
}
