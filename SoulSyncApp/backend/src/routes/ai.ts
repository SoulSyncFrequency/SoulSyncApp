import { Router } from 'express'
import { ai } from '../ai'
import { retry } from '../utils/retry'
import { withBreaker } from '../utils/breaker'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'

const r = Router()

r.post('/ai/summarize', gateFeature('aiApi'), requireAuth, async (req, res) => {
  const { text, maxTokens } = req.body || {}
  if (!text) return res.status(400).json({ error: { code:'bad_request', message:'`text` required' } })
  try {
    const summary = await retry(() => withBreaker(ai.summarize)(String(text), { maxTokens }))
    res.json({ summary })
  } catch (e: any) {
    res.status(500).json({ error: { code:'server_error', message: e?.message || 'AI error' } })
  }
})

r.post('/ai/classify', gateFeature('aiApi'), requireAuth, async (req, res) => {
  const { text, labels } = req.body || {}
  if (!text) return res.status(400).json({ error: { code:'bad_request', message:'`text` required' } })
  try {
    const rsl = await ai.classify(String(text), { labels })
    res.json(rsl)
  } catch (e: any) {
    res.status(500).json({ error: { code:'server_error', message: e?.message || 'AI error' } })
  }
})

export default r
