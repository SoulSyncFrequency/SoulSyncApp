import { Router } from 'express'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'
import { ai } from '../ai'

const r = Router()

r.post('/ai/intent', gateFeature('aiIntent'), requireAuth, async (req, res) => {
  const { text, labels } = req.body || {}
  if (!text) return res.status(400).json({ error:{code:'bad_request', message:'text required'} })
  try {
    const result = await ai.classify(String(text), { labels: labels||['general','panic','billing','support'] })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error:{ code:'server_error', message:e?.message||'AI error' } })
  }
})

export default r
