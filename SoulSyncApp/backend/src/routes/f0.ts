import { Router } from 'express'
import { env } from '../config/env'
let IORedis: any = null; try{ IORedis = require('ioredis') }catch{}

import crypto from 'crypto'
import { computeF0 } from '../services/F0Engine.v2'
import { F0InputSchema } from '../schemas/f0'
import { LRU } from '../utils/lru'

const router = Router()
const cache = new LRU<string, number>(Number(process.env.F0_CACHE_MAX || 1000), Number(process.env.F0_CACHE_TTL_MS || 5*60*1000))
const rc = (process.env.F0_REDIS_CACHE==='1' && IORedis && process.env.REDIS_URL) ? new IORedis(process.env.REDIS_URL) : null

let Histogram: any = null
try { Histogram = require('prom-client').Histogram } catch {}

const hist = Histogram ? new Histogram({ name: 'f0_route_duration_seconds', help: 'F0 route latency', buckets: [0.01,0.05,0.1,0.25,0.5,1,2,5] }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response) : null

router.get('/f0/healthz', (_req, res)=>{
  try{
    const probe = { Sym:.8, Pol:.7, Bph:.9, Emo:.6, Coh:.7, Frac:.5, Conn:.6, Chak:.7, Info:.8, Safe:.9, disease_type:'psychological' as const }
    const score = computeF0(probe as any)
    const response:any = { ok:true, score }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message || 'health_error' }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
  }
}
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)

router.post('/f0score', async (req, res)=>{
  const end = hist ? hist.startTimer() : null
  try{
    const parsed = F0InputSchema.safeParse(req.body || {}
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
    if(!parsed.success){
      return res.status(400).json({ error:'validation_error', details: parsed.error.flatten() }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
    }
    const body = parsed.data
    const key = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex')
    let cached = cache.get(key)
    if(rc && cached===undefined){ const v = await rc.get('f0:'+key); if(v!=null){ cached = Number(v) } }
    if(typeof cached === 'number'){
      end?.()
      const response:any = { F0_score: cached, cached:true }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
    }

    const score = computeF0(body as any)
    cache.set(key, score)
    if(rc){ try{ await rc.setex('f0:'+key, Math.floor((Number(process.env.F0_CACHE_TTL_MS)||300000)/1000), String(score)) }catch{} }
    end?.()
    const response:any = { F0_score: score, cached:false }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
  }catch(e:any){
    end?.()
    return res.status(500).json({ error: e?.message || 'f0_error' }
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)
  }
}
    if(explain){ response.breakdown = input; response.algoVersion = algoVersion }
    return res.json(response)

export default router
