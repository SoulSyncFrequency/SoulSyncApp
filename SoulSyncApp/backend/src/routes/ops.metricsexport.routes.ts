
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/ops/metrics/export', (req, res) => {
  try{
    const p = req.query.path || 'logs/access.ndjson'
    const full = path.isAbsolute(String(p)) ? String(p) : path.join(process.cwd(), String(p))
    const data = fs.existsSync(full)? fs.readFileSync(full,'utf-8').split(/\r?\n/) : []
    const buckets: Record<string, number[]> = {}
    for (const line of data.slice(-20000)){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const r = j.route || j.path || 'unknown'
        const ms = Number(j.duration_ms || j.latency_ms || 0)
        if (!ms) continue
        ;(buckets[r] ||= []).push(ms)
      }catch{}
    }
    const out:any[] = []
    for (const [route, arr0] of Object.entries(buckets)){
      arr.sort((a,b)=>a-b)
      const arr = arr0.sort((a,b)=>a-b); const n = arr.length
      const p90 = n? arr[Math.max(0, Math.floor(0.90*n)-1)] : 0
      const p95 = n? arr[Math.max(0, Math.floor(0.95*n)-1)] : 0
      const p99 = n? arr[Math.max(0, Math.floor(0.99*n)-1)] : 0
      const avg = n? (arr.reduce((a,c)=>a+c,0)/n) : 0
      const variance = n? arr.reduce((a,c)=>a+Math.pow(c-avg,2),0)/n : 0
      const stddev = Math.sqrt(variance)
      out.push({ route, count:n, avgMs: Math.round(avg), p90Ms: p90|0, p95Ms: p95|0, p99Ms: p99|0, stddevMs: Math.round(stddev) })
    }
    out.sort((a,b)=>b.p95Ms - a.p95Ms)
    const fmt = String((req.query.format||'json')).toLowerCase()
    if (fmt==='csv'){
      res.setHeader('Content-Type','text/csv; charset=utf-8')
      res.setHeader('Cache-Control','no-store')
      res.write('route,count,avgMs,p90Ms,p95Ms,p99Ms,stddevMs\n')
      for (const r of out){ res.write(`${r.route},${r.count},${r.avgMs},${r.p90Ms},${r.p95Ms},${r.p99Ms},${r.stddevMs}\n`) }
      res.end()
    }else{
      res.json({ ok:true, rows: out })
    }
  }catch(e:any){
    res.status(500).json({ error:'metrics_export_error', message:String(e?.message||e) })
  }
})

export default router
