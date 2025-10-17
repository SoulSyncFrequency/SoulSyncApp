import { if(detectRisk(JSON.stringify(req.body||{}))) return res.status(400).json({ ok:false, code:'risk_detected' });  detectRisk } from '../ai/risk'
import { guardedJSON } from '../ai/guard'
import { Router } from 'express'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'
import { generateRecommendations } from '../workers/recommendations'

const r = Router()

r.get('/recommendations', gateFeature('aiRec'), requireAuth, async (req, res) => {
  try {
    const recs = await generateRecommendations(String(req.user?.id || 'anon'))
    res.json({ recommendations: recs })
  } catch (e: any) {
    res.status(500).json({ error: { code:'server_error', message:e?.message||'AI error' } })
  }
})

export default r
