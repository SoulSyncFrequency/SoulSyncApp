import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { gateFeature } from '../config/flags'
import { guardedJSON, Shape } from '../ai/guard'

const r = Router()

r.post('/ai/schema/summary', gateFeature('aiApi'), requireAuth, async (req, res) => {
  const { prompt='', shape } = req.body || {}
  if (!shape || typeof shape !== 'object') return res.status(400).json({ error:{ code:'bad_request', message:'shape required' } })
  const result = await guardedJSON(prompt, shape as Shape, 2)
  res.json(result)
})

export default r
