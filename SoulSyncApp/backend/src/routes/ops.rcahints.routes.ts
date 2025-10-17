
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.get('/ops/rca-hints', (req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const now = Date.now()
    const win = windowMsFrom(req.query)
    const lines = fs.existsSync(p)? fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000) : []
    let total=0, errs=0, timeouts=0, routes: Record<string, {n:number, p95:number, lat:number[]}> = {}
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > win) continue
        total++
        const st = Number(j.status||0); if (st>=500) errs++
        if (st===504) timeouts++
        const r = (j.route || j.path || 'unknown') as string
        const ms = Number(j.duration_ms || j.latency_ms || 0)
        if (!routes[r]) routes[r] = { n:0, p95:0, lat:[] }
        routes[r].n++
        if (ms) routes[r].lat.push(ms)
      }catch{}
    }
    // compute p95 per route
    for (const r of Object.keys(routes)){
      const arr = routes[r].lat.sort((a,b)=>a-b)
      if (arr.length){ routes[r].p95 = arr[Math.max(0, Math.floor(0.95*arr.length)-1)] }
    }
    const hints:string[] = []
    const errRate = total? (errs/total) : 0
    if (errRate>0.1) hints.push(`High error rate ${(errRate*100).toFixed(1)}% → check recent deploys, DB connectivity, rate-limit/backpressure`)
    if (timeouts>0) hints.push(`Detected ${timeouts}x 504 timeouts → likely upstream dependency or DB lock/contention`)
    // single-route spike vs global
    const rows = Object.entries(routes).map(([route,info])=>({route, p95: info.p95, n: info.n})).filter(r=>r.n>10).sort((a,b)=>b.p95-a.p95)
    if (rows.length){
      const top = rows[0]
      const median = rows[Math.floor(rows.length/2)].p95
      if (top.p95 > 2*median) hints.push(`P95 spike isolated at ${top.route} (~${top.p95}ms) → suspect N+1 query, missing index, or heavy serialization`)
    }
    if (!hints.length) hints.push('No obvious root-cause hints (best-effort)')
    res.json({ ok:true, sampleCount: total, errRate: Number(errRate.toFixed(4)), timeouts, topRoutes: rows.slice(0,5), hints })
  }catch(e:any){
    res.status(500).json({ error:'rca_hints_error', message:String(e?.message||e) })
  }
})

export default router
