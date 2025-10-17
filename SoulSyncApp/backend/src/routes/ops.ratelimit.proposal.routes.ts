
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/ops/rl-proposal', (_req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','access.ndjson')
    let count = 0
    let errs = 0
    let totalMs = 0
    let maxMs = 0
    try{
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/)
      for (const line of lines){
        if (!line.trim()) continue
        count++
        try{
          const j = JSON.parse(line)
          const ms = Number(j.duration_ms || j.latency_ms || 0)
          totalMs += ms
          if (ms>maxMs) maxMs = ms
          const st = Number(j.status || 0)
          if (st>=500) errs++
        }catch{}
      }
    }catch{}
    const avg = count? (totalMs/count): 0
    // Simple heuristic: if avg latency < 150ms and 5xx rate < 1%, suggest slightly tighter window
    const errRate = count? (errs/count): 0
    let suggestion = 'keep'
    if (avg < 150 && errRate < 0.01) suggestion = 'tighten_window_10pct'
    else if (avg > 400 || errRate > 0.05) suggestion = 'loosen_window_10pct'
    res.json({ ok:true, sampleCount: count, avgLatencyMs: Math.round(avg), maxLatencyMs: Math.round(maxMs), errorRate: Number(errRate.toFixed(4)), suggestion, disclaimer: 'Advisory only; does not change config automatically.' })
  }catch(e:any){
    res.status(500).json({ error:'proposal_error', message:String(e?.message||e) })
  }
})
export default router
