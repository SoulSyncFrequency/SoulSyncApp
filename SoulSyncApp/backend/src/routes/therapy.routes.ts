import { Router } from 'express'
import { enforceF0Safe } from '../services/f0Guard'
import { requireEntitlement } from '../middleware/entitlement'
import { detectRisk } from '../ai/risk'

const router = Router()
import { perKeyRateLimiter } from '../middleware/tierPricing'
import { apiKeyRateLimit } from '../middleware/apiKeyRateLimit'
import { createBackpressure } from '../middleware/backpressure'

/**
 * Demo therapy generation endpoint — protected by entitlements.
 * First call (free credit) passes; after credits exhausted, guard will block with 402.
 */
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))
router.post('/api/therapy/generate', requireEntitlement, perKeyRateLimiter(), apiKeyRateLimit('therapy', Number(process.env.RPM_TOKENS||'0')||undefined, 60), backpressure, async (req, res) => {
  if (detectRisk(JSON.stringify(req.body||{}))) {
    return res.status(400).json({ ok:false, code:'risk_detected' })
  }
  // simulate some output (replace with real AI pipeline guarded by schema in production)
  res.json({ ok: true, plan: "Therapy plan demo." })
})

export default router
