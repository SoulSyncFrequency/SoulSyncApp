import { metricsHooks } from '../routes/metrics.routes'
import type { Request, Response, NextFunction } from 'express'

const seen = new Map<string,{ ts:number, status:number, body:any }>()
const TTL = 10 * 60 * 1000
const policy:Record<string,'on'|'off'> = { '/auth/mfa/recovery/consume':'on' } // 10 min

const excludePrefixes = ['/webhooks', '/csp', '/healthz', '/readyz', '/livez']
import { config } from '../config'
export function idempotency(req:Request, res:Response, next:NextFunction){
  if(!['POST','PUT','PATCH','DELETE'].includes(req.method)) { metricsHooks.idempotent_skipped(); return next() }
  if(policy[req.path]==='off' || config.IDEMPOTENCY_OFF_PATHS.includes(req.path)) return next()
  if(excludePrefixes.some(p=> req.path.startsWith(p))) return next()
  const key = String(req.headers['idempotency-key']||'')
  if(!key) return res.status(400).json({ error:{ code:'idempotency_key_required' } })
  const now = Date.now()
  const prev = seen.get(key)
  if(prev && now - prev.ts < TTL){ metricsHooks.idempotent_replay();
    res.status(prev.status).json(prev.body); return
  }
  // Monkey-patch res.json to capture response
  const _json = res.json.bind(res)
  ;(res as any).json = (body:any)=>{
    try{ seen.set(key, { ts: Date.now(), status: res.statusCode || 200, body }) }catch{}
    return _json(body)
  }
  next()
}
