
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }
const router = Router()
router.get('/ops/route-detail', (req, res) => {
  try{
    const pth = String(req.query.path||'').trim()
    if (!pth) return res.status(400).json({ error:'missing_path', message:'Provide ?path=/api/route' })
    const win = windowMsFrom(req.query), now = Date.now()
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const lat:number[] = []; let total=0, err=0
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-50000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > win) continue
          const r = (j.route || j.path || '')
          if (r !== pth) continue
          total++
          const st = Number(j.status||0); if (st>=500) err++
          const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms) lat.push(ms)
        }catch{}
      }
    }
    lat.sort((a,b)=>a-b); const n = lat.length
    function q(p:number){ return n? lat[Math.max(0, Math.floor(p*n)-1)] : 0 }
    const p50=q(0.50)|0, p90=q(0.90)|0, p95=q(0.95)|0, p99=q(0.99)|0
    const avg = n? Math.round(lat.reduce((a,c)=>a+c,0)/n) : 0
    const errRate = total? (err/total) : 0
    res.json({ ok:true, path: pth, windowMs: win, count: total, errRate: Number(errRate.toFixed(4)), p50Ms: p50, avgMs: avg, p90Ms: p90, p95Ms: p95, p99Ms: p99 })
  }catch(e:any){ res.status(500).json({ error:'route_detail_error', message:String(e?.message||e) }) }
})
export default router
