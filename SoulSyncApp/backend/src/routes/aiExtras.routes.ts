import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { ai } from '../ai'
import { gateFeature } from '../config/flags'

const r = Router()

r.post('/ai/consent/summary', gateFeature('aiApi'), requireAuth, async (req, res) => {
  const { text='' } = req.body || {}
  if (!text) return res.status(400).json({ error:{ code:'bad_request', message:'text required' } })
  const summary = await ai.summarize(`Sažmi pravni dokument u ≤6 točaka (HR), neutralno, jasno.\nTEXT:\n${text}`, { maxTokens: 300 } as any)
  res.json({ summary })
})

r.get('/ai/dailyNudge', gateFeature('aiApi'), requireAuth, async (_req, res) => {
  const msg = await ai.summarize('Generiraj kratku dnevnu motivacijsku poruku (HR, ≤30 riječi).', { maxTokens: 60 } as any)
  res.json({ message: msg })
})

export default r
