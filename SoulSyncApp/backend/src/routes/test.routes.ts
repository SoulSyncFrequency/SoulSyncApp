import { Router } from 'express'
import { requireEntitlement } from '../middleware/entitlement'
const router = Router()

if (process.env.NODE_ENV !== 'production') {
  router.get('/api/_test/protected', requireEntitlement, (_req, res) => {
    res.json({ ok: true })
  })
}

export default router
