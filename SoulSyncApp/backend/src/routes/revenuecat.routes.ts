import { Router } from 'express'
import { fetchRevenueCatEntitlements } from '../services/revenuecat'
import { setActive } from '../services/entitlementService'

const router = Router()

/**
 * Manual sync: call from mobile after a successful IAP if needed.
 * Body: { userId: string }
 */
router.post('/api/revenuecat/sync', async (req, res) => {
  try {
    const { userId } = req.body || {}
    if (!userId) return res.status(400).json({ error: 'userId_required' })
    const ent = await fetchRevenueCatEntitlements(userId)
    if (ent && typeof ent.active === 'boolean') {
      await setActive(userId, ent.active)
    }
    res.json({ synced: !!ent, active: ent?.active ?? undefined })
  } catch (e: unknown) {
    res.status(500).json({ error: 'revenuecat_sync_failed', message: e.message })
  }
})

export default router
