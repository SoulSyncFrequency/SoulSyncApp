import { Router } from 'express'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'
import { generateSummary } from '../workers/summaries'

const r = Router()

r.get('/me/summary', gateFeature('aiSummary'), requireAuth, async (req, res) => {
  try {
    const data = await generateSummary(String(req.user?.id || 'anon'))
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: { code:'server_error', message:e?.message||'AI error' } })
  }
})

export default r
