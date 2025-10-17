import { Router } from 'express'
import { logger } from '../logger'
import { pushReport, groupedByDirective, listReports, clearReports } from '../store/cspStore'
import { ai } from '../ai'
import { requireAdmin } from '../middleware/auth'

const r = Router()

// Receive browser report
r.post('/csp-report', (req:any, res:any)=>{
  try{
    const payload = req.body || {}
    pushReport(payload)
    logger.warn({ csp: payload }, 'CSP report')
  }catch{}
  res.status(204).end()
})

// Admin view (JSON) — lightweight, no DB required
r.get('/admin/csp/reports', requireAdmin, (req:any, res:any)=>{
  const since = Number(req.query.sinceMs||0) || undefined
  const grouped = groupedByDirective(since)
  res.json({ grouped, total: listReports(since).length })
})

// Admin: raw list (pagination naive)
r.get('/admin/csp/reports/raw', requireAdmin, (req:any, res:any)=>{
  res.json(listReports())
})

// Admin: clear buffer
r.post('/admin/csp/reports/clear', requireAdmin, (_req:any, res:any)=>{
  clearReports()
  res.json({ ok: true })
})

export default r


// Optional: AI suggestion to refine policy (uses provider if configured)
r.get('/admin/csp/suggest', requireAdmin, async (_req:any, res:any)=>{
  try{
    const grouped = groupedByDirective()
    const txt = grouped.map(g=>`- ${g.directive} at ${g.blocked}: ${g.count}x`).join('\n')
    const prompt = `We have these CSP violations (directive at blocked-uri: count):\n${txt}\nSuggest 3 concise policy fixes or code changes.`
    const summary = await ai.summarize(prompt)
    res.json({ ok:true, summary })
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message||String(e) })
  }
})
