
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.get('/ops/slo-status', (req, res) => {
  try{
    const win = windowMsFrom(req.query)
    const now = Date.now()
    const p = path.join(process.cwd(),'logs','access.ndjson')
    let total=0, errs=0
    const lat:number[] = []
    const lines = fs.existsSync(p)? fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000) : []
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > win) continue
        total++
        const st = Number(j.status||0); if (st>=500) errs++
        const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms) lat.push(ms)
      }catch{}
    }
    lat.sort((a,b)=>a-b)
    const n = lat.length
    const p95 = n? lat[Math.max(0, Math.floor(0.95*n)-1)] : 0
    const p99 = n? lat[Math.max(0, Math.floor(0.99*n)-1)] : 0
    const errRate = total? (errs/total) : 0
    const targets = { errRate: 0.01, p95Ms: 500, p99Ms: 1500 }
    const ok = (errRate <= targets.errRate) && (p95 <= targets.p95Ms) && (p99 <= targets.p99Ms)
    res.json({ ok, windowMs: win, totals: { count: total, errors: errs }, metrics: { errRate: Number(errRate.toFixed(4)), p95Ms: p95|0, p99Ms: p99|0 }, targets })
  }catch(e:any){
    res.status(500).json({ error:'slo_status_error', message:String(e?.message||e) })
  }
})

export default router
