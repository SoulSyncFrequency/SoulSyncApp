
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.get('/ops/rl-dryrun', (req, res) => {
  try{
    const action = String(req.query.action||'keep') // keep|tighten|loosen
    const pct = Math.max(1, Math.min(50, Number(req.query.pct||10))) // 1..50
    const now = Date.now()
    const win = windowMsFrom(req.query)
    const p = path.join(process.cwd(),'logs','access.ndjson')
    let total=0, rejected=0, wouldReject=0
    const lines = fs.existsSync(p)? fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000) : []
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > win) continue
        total++
        if (j.status === 429) rejected++
        // Heuristic: if tighten, assume threshold reduces by pct → more requests would be 429
        // We simulate by treating fastest (e.g., small duration) as less likely to be limited; use a crude proxy: if duration_ms is high, it happened under load.
        const ms = Number(j.duration_ms || j.latency_ms || 0)
        if (action==='tighten' && ms>300) wouldReject++
        if (action==='loosen' && j.status===429 && ms<300) wouldReject--
      }catch{}
    }
    const projRejected = Math.max(0, rejected + wouldReject)
    res.json({ ok:true, windowMs: win, sampleCount: total, baseline429: rejected, action, pct, projected429: projRejected, disclaimer: 'Heuristic dry-run; no config change.' })
  }catch(e:any){
    res.status(500).json({ error:'rl_dryrun_error', message:String(e?.message||e) })
  }
})

export default router
