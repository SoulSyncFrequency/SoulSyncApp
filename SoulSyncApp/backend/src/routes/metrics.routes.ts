import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { config } from '../config'
let counters:Record<string,number> = {}
export function inc(name:string){ counters[name]=(counters[name]||0)+1 }

const r = Router()
r.get('/metrics', (req,res)=>{

  if(!config.ENABLE_METRICS) return res.status(404).end()
  res.type('text/plain')
  const lines = []
  for(const [k,v] of Object.entries(counters)){
    lines.push(`${k} ${v}`)
    if(k==='http_requests_total'){
      // simulate labels by route/method
      for(const [route,count] of Object.entries(routeCounters)){
        lines.push(`http_requests_total{route="${route.replace(/\"/g,'')}",method="*"} ${count}`)
      }
    }
  }
  lines.push(`# HELP http_requests_by_route Latency buckets per route`) 
  for(const [route,bks] of Object.entries(latBuckets)){
    for(const b of bks){
      const le = b.le===Infinity? '+Inf' : b.le
      lines.push(`http_request_duration_ms_bucket{route="${route}",le="${le}"} ${b.n}`)
    }
  }
  lines.push(`idempotency_hits_total ${idemHits}`)
  lines.push(`idempotency_skipped_total ${idemSkipped}`)
  lines.push(`idempotency_replay_total ${idemReplay}`)
  lines.push(`rate_limited_total ${rlHits}`)
  res.send(lines.join('\n'))
})
export default r

export function mwCount(name:string){
  return (_req:any,_res:any,next:any)=>{ inc(name); next() }
}
export function incErr(name:string){
  return (_req:any,res:any,next:any)=>{
    const orig = res.status
    res.status = function(code:number){ if(code>=400) inc(name); return orig.call(this, code) }
    next()
  }
}

const routeCounters:Record<string,number> = {}
export function mwCountRoute(){
  return (req:any,_res:any,next:any)=>{
    const key = `${req.method} ${req.route?.path||req.path}`.slice(0,120)
    routeCounters[key] = (routeCounters[key]||0)+1
    next()
  }
}

type Buckets = {le:number, n:number}[]
const latBuckets: Record<string, Buckets> = {}
const LAT_EDGES = [50,100,200,500,1000,2000,5000]
export function mwLatency(){
  return (req:any,res:any,next:any)=>{
    const t0=Date.now()
    res.on('finish', ()=>{
      const dt=Date.now()-t0
      const route = `${req.method} ${req.route?.path||req.path}`.slice(0,120)
      if(!latBuckets[route]) latBuckets[route] = LAT_EDGES.map(le=>({le, n:0})).concat([{le:Infinity,n:0}])
      for(const b of latBuckets[route]){ if(dt<=b.le){ b.n++; break } }
    })
    next()
  }
}

// Extra counters
let idemHits=0, idemSkipped=0, idemReplay=0
let rlHits=0
export const metricsHooks = {
  idempotent_hit(){ idemHits++ },
  idempotent_skipped(){ idemSkipped++ },
  idempotent_replay(){ idemReplay++ },
  rate_limited(){ rlHits++ }
}

r.get('/metrics/alerts', (_req,res)=>{
  const RL_MAX = Number(process.env.ALERT_RL_MAX||'100')
  const IDEM_REPLAY_MAX = Number(process.env.ALERT_IDEM_REPLAY_MAX||'100')
  const status = {
    rateLimitedOk: (typeof rlHits==='number') ? rlHits <= RL_MAX : true,
    idempotencyReplayOk: (typeof idemReplay==='number') ? idemReplay <= IDEM_REPLAY_MAX : true
  }
  const LAT_P90_MAX = Number(process.env.ALERT_LAT_P90||'1000')\n  const LAT_P99_MAX = Number(process.env.ALERT_LAT_P99||'3000')\n  const latOk = { latencyP90Ok:true, latencyP99Ok:true }\n  // naive evaluation: if hist buckets exist, check counts\n  try{\n    for(const [route,bks] of Object.entries(latBuckets)){\n      let total=0, belowP90=0, belowP99=0\n      for(const b of bks){ total+=b.n }\n      let cum=0\n      for(const b of bks){ cum+=b.n; if(cum/total>=0.9){ if(b.le>LAT_P90_MAX) latOk.latencyP90Ok=false; break } }\n      cum=0; for(const b of bks){ cum+=b.n; if(cum/total>=0.99){ if(b.le>LAT_P99_MAX) latOk.latencyP99Ok=false; break } }\n    }\n  }catch{}\n  res.json({ ok: status.rateLimitedOk && status.idempotencyReplayOk && latOk.latencyP90Ok && latOk.latencyP99Ok, status:{...status,...latOk} })
})
