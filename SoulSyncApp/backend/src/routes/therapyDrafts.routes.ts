import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { requireAuth } from '../middleware/requireAuth'
const r = Router()

r.post('/therapy/drafts/promote', requireAuth, async (req:any,res)=>{
  // Best-effort: in real impl, persist as therapyRun. Here, just acknowledge and let existing flows process on client.
  const draft = req.body
  console.log('[draft-promote]', (req as any).user?.id, JSON.stringify(draft).slice(0,1000))
  res.json({ ok:true })
})

export default r
