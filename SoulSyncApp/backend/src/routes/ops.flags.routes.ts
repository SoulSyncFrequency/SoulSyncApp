
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/ops/flags', (req, res) => {
  const flags = {
    CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY,
    PROGESTE_FEATURE_ENABLED: process.env.PROGESTE_FEATURE_ENABLED,
    PREGNENOLONE_FEATURE_ENABLED: process.env.PREGNENOLONE_FEATURE_ENABLED,
    SUPPL_REQUIRE_CLINICIAN_OK: process.env.SUPPL_REQUIRE_CLINICIAN_OK,
    SUPPL_AI_SUMMARY_ENABLED: process.env.SUPPL_AI_SUMMARY_ENABLED,
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE
  }
  res.json({ flags })
})

export default router
