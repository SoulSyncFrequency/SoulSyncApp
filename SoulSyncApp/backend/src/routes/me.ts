import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { userRateLimit } from '../middleware/userRateLimit'

const r = Router()
r.get('/me', requireAuth, userRateLimit('me', Number(process.env.USER_RL_MAX||120), Number(process.env.USER_RL_WINDOW_SEC||60)), (req, res) => {
  res.json({ user: (req as any).user })
})

export default r
