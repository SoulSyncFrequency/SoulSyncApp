
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }
function readLines(p:string, tail:number){ try{ return fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-tail) }catch{ return [] } }

const router = Router()
router.get('/ops/snapshot', (req, res) => {
  try{
    const win = windowMsFrom(req.query), now = Date.now()
    const lines = readLines(path.join(process.cwd(),'logs','access.ndjson'), 50000)
    let total=0, errs=0, lat:number[] = [], byRoute: Record<string, number[]> = {}, errSig: Record<string, number> = {}
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > win) continue
        total++
        const st = Number(j.status||0); if (st>=500) errs++
        const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms){ lat.push(ms); const r=j.route||j.path||'unknown'; (byRoute[r] ||= []).push(ms) }
        if (st>=400){ const sig = `${st} ${(j.error_code||'')}`.trim(); errSig[sig] = (errSig[sig]||0)+1 }
      }catch{}
    }
    lat.sort((a,b)=>a-b); const n = lat.length
    const p95 = n? lat[Math.max(0, Math.floor(0.95*n)-1)]|0 : 0
    const errRate = total? errs/total : 0
    const topRoutes = Object.entries(byRoute).map(([r,arr])=>{ arr.sort((a,b)=>a-b); const m=arr.length; return { route:r, count:m, p95Ms: m? arr[Math.max(0, Math.floor(0.95*m)-1)]|0 : 0 } }).sort((a,b)=>b.p95Ms-a.p95Ms).slice(0,5)
    const topErrors = Object.entries(errSig).map(([sig,n])=>({sig, n})).sort((a,b)=>b.n-a.n).slice(0,5)
    const anomalyHints = []
    if (errRate>0.05) anomalyHints.push(`High 5xx rate ${(errRate*100).toFixed(1)}% in window`)
    if (p95>500) anomalyHints.push(`High p95 latency ~${p95}ms in window`)
    if (!anomalyHints.length) anomalyHints.push('No anomalies detected (best-effort)')
    res.json({ ok:true, windowMs: win, totals:{ count: total, errors: errs }, metrics:{ p95Ms:p95, errRate: Number(errRate.toFixed(4)) }, topRoutes, topErrors, anomalyHints })
  }catch(e:any){
    res.status(500).json({ error:'snapshot_error', message:String(e?.message||e) })
  }
})
export default router
