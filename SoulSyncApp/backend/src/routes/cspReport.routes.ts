import * as Sentry from '@sentry/node'
import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
const r = Router()
r.post('/csp/report', (req:any,res)=>{
  const body = req.body || {}
  // In production, persist to log store; here we just log compactly:
  Sentry.captureMessage('CSP-REPORT:'+JSON.stringify(body)); console.warn('[CSP-REPORT]', JSON.stringify(body).slice(0,2000))
  res.status(204).end()
})
export default r
