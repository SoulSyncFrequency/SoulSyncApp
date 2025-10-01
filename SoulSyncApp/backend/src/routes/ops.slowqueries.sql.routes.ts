
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const router = Router()
router.get('/ops/slow-queries', (req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','sql_slow.ndjson')
    const rows:any[] = []
    const limit = Math.max(1, Math.min(200, Number(req.query.limit||50)))
    const sinceRaw = String(req.query.since||'').trim()
    let sinceMs = 0
    if (sinceRaw){
      const asNum = Number(sinceRaw)
      if (!Number.isNaN(asNum) && asNum>0){ sinceMs = asNum }
      else {
        const d = Date.parse(sinceRaw); if (!Number.isNaN(d)) sinceMs = d
      }
    }
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-5000)
      for (const line of lines){
        if (!line) continue
        try{ const j = JSON.parse(line); if (sinceMs && Number(j.t||0) < sinceMs) { /*skip*/ } else { rows.push(j) } }catch{}
      }
    }
    const map: Record<string, { n:number, maxMs:number, avgMs:number, lastTs:number, sample:string }> = {}
    for (const r of rows){
      const sig = crypto.createHash('sha1').update(String(r.text||'')).digest('hex')
      const m = map[sig] || { n:0, maxMs:0, avgMs:0, lastTs:0, sample: String(r.text||'') }
      m.n += 1
      m.maxMs = Math.max(m.maxMs, Number(r.ms||0))
      m.avgMs = ((m.avgMs*(m.n-1)) + Number(r.ms||0)) / m.n
      m.lastTs = Math.max(m.lastTs, Number(r.t||0))
      map[sig] = m
    }
    const top = Object.entries(map).map(([sig,info])=>({ sig, n:info.n, maxMs: Math.round(info.maxMs), avgMs: Math.round(info.avgMs), lastTs: info.lastTs, sample: info.sample.slice(0,500)})).sort((a,b)=> b.maxMs - a.maxMs).slice(0, limit)
    res.json({ ok:true, count: rows.length, top })
  }catch(e:any){
    res.status(500).json({ error:'slow_queries_error', message:String(e?.message||e) })
  }
})
export default router
