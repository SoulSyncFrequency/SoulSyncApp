import { Router } from 'express'
import { requireApiKey } from '../middleware/apiKey'
import { apiKeyRateLimit } from '../middleware/apiKeyRateLimit'

const r = Router()
r.post('/api/ping', requireApiKey(), apiKeyRateLimit('apikey', Number(process.env.RL_APIKEY_MAX||120), Number(process.env.RL_APIKEY_WINDOW_SEC||60)), (req, res) => {
  res.json({ ok: true, key: (req as any).apiKey })
})

export default r
