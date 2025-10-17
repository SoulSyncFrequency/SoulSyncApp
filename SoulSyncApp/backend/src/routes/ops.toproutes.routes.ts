
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.get('/ops/top-routes', (req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const now = Date.now()
    const win = windowMsFrom(req.query)
    const buckets: Record<string, number[]> = {}
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > win) continue
          const r = j.route || j.path || 'unknown'
          const ms = Number(j.duration_ms || j.latency_ms || 0); if (!ms) continue
          ;(buckets[r] ||= []).push(ms)
        }catch{}
      }
    }
    const rows:any[] = []
    for (const [route, arr] of Object.entries(buckets)){
      arr.sort((a,b)=>a-b)
      const n = arr.length
      if (!n) continue
      const p50 = arr[Math.max(0, Math.floor(0.50*n)-1)]
      const p95 = arr[Math.max(0, Math.floor(0.95*n)-1)]
      const p99 = arr[Math.max(0, Math.floor(0.99*n)-1)]
      const avg = arr.reduce((a,c)=>a+c,0)/n
      rows.push({ route, count:n, p50Ms:p50|0, avgMs:Math.round(avg), p95Ms:p95|0, p99Ms:p99|0 })
    }
    rows.sort((a,b)=> b.p95Ms - a.p95Ms )
    const n = Math.max(1, Math.min(100, Number(req.query.n||20)))
    res.json({ ok:true, windowMs: win, rows: rows.slice(0, n) })
  }catch(e:any){
    res.status(500).json({ error:'top_routes_error', message:String(e?.message||e) })
  }
})

export default router
