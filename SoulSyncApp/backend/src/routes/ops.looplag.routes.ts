
import { Router } from 'express'
import { loopLagSummary } from '../services/loopLag'

const router = Router()
router.get('/ops/loop-lag', (_req, res) => {
  const s = loopLagSummary()
  res.json({ ok:true, ...s })
})
export default router
