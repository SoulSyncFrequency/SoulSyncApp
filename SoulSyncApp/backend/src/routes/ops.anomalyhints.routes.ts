
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/ops/anomaly-hints', (req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const now = Date.now()
    const w = String((req.query.window||'15m')).toLowerCase(); const windowMs = w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000)
    let total=0, errs=0, latSum=0, latN=0
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-5000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > windowMs) continue
          total++
          const st = Number(j.status||0); if (st>=500) errs++
          const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms){ latSum += ms; latN++ }
        }catch{}
      }
    }
    const errRate = total? (errs/total): 0
    const avgLat = latN? (latSum/latN): 0
    const hints:string[] = []
    if (errRate > 0.05) hints.push(`High 5xx rate ${(errRate*100).toFixed(1)}% in last 15m`)
    if (avgLat > 500) hints.push(`High avg latency ~${Math.round(avgLat)}ms in last 15m`)
    if (!hints.length) hints.push('No anomalies detected in last 15m (best-effort)')
    res.json({ ok:true, errorRate: Number(errRate.toFixed(4)), avgLatencyMs: Math.round(avgLat), hints })
  }catch(e:any){
    res.status(500).json({ error:'anomaly_hints_error', message:String(e?.message||e) })
  }
})

export default router
