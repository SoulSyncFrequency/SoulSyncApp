
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { notifyAll } from '../services/notifier'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.post('/ops/check-alerts', async (req, res) => {
  try{
    const token = (req.headers['x-ops-token']||'').toString();
    if (process.env.OPS_ALERT_TOKEN && token !== process.env.OPS_ALERT_TOKEN) { return res.status(401).json({ error:'unauthorized' }) }
    if ((process.env.OPS_ALERTS_ENABLED||'false').toLowerCase()!=='true'){
      return res.status(503).json({ error:'alerts_disabled' })
    }
    const errThresh = Number(process.env.OPS_ALERT_THRESHOLD_ERRRATE||'0.05')
    const latThresh = Number(process.env.OPS_ALERT_THRESHOLD_AVGMS||'500')
    const cooldownSec = Number(process.env.OPS_ALERT_COOLDOWN_SEC||'600')
    const win = windowMsFrom(req.query)
    const now = Date.now()
    const lastFile = path.join(process.cwd(), '.ops_alert_last')
    let last=0
    try{ last = Number(fs.readFileSync(lastFile,'utf-8'))||0 }catch{}
    if (now - last < cooldownSec*1000){
      return res.json({ ok:true, skipped:true, reason:'cooldown', cooldownSec })
    }

    const p = path.join(process.cwd(),'logs','access.ndjson')
    let total=0, errs=0, latSum=0, latN=0
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > win) continue
          total++
          const st = Number(j.status||0); if (st>=500) errs++
          const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms){ latSum += ms; latN++ }
        }catch{}
      }
    }
    const errRate = total? (errs/total): 0
    const avgLat = latN? (latSum/latN): 0
    const breach = (errRate>errThresh) || (avgLat>latThresh)
    if (!breach){
      return res.json({ ok:true, breach:false, errRate: Number(errRate.toFixed(4)), avgLatencyMs: Math.round(avgLat) })
    }
    const subject = `Ops Alert: errRate=${(errRate*100).toFixed(1)}% avg=${Math.round(avgLat)}ms (win ${Math.round(win/60000)}m)`
    const body = `Thresholds: err>${errThresh*100}% or avg>${latThresh}ms. Current: err=${(errRate*100).toFixed(2)}% avg=${Math.round(avgLat)}ms.`
    const results = await notifyAll(subject, body)
    try{ fs.writeFileSync(lastFile, String(now)) }catch{}
    res.json({ ok:true, breach:true, errRate: Number(errRate.toFixed(4)), avgLatencyMs: Math.round(avgLat), notified: results })
  }catch(e:any){
    res.status(500).json({ error:'alerts_error', message:String(e?.message||e) })
  }
})

export default router
