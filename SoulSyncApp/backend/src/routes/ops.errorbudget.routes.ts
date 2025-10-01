
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/ops/error-budget', (req, res) => {
  try{
    const w = String((req.query.window||'24h')).toLowerCase()
    const win = w==='7d'? (7*86400*1000) : w==='30d'? (30*86400*1000) : (24*86400*1000)
    const now = Date.now()
    const p = path.join(process.cwd(),'logs','access.ndjson')
    let total=0, errs=0
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-100000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > win) continue
          total++
          const st = Number(j.status||0); if (st>=500) errs++
        }catch{}
      }
    }
    const errRate = total? errs/total : 0
    const slo = 0.001 // 99.9% availability
    const budget = Math.max(0, slo - errRate)
    res.json({ ok:true, windowMs: win, total, errors: errs, errRate: Number(errRate.toFixed(5)), sloTarget: 0.999, remainingErrorBudget: Number(budget.toFixed(5)) })
  }catch(e:any){
    res.status(500).json({ error:'error_budget_error', message:String(e?.message||e) })
  }
})
export default router
