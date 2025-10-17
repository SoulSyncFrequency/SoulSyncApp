
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/debug/headers', (req, res) => {
  const filtered:any = {}
  for (const [k,v] of Object.entries(req.headers||{})){
    if (/authorization|cookie|token/i.test(k)) continue
    filtered[k]=v
  }
  res.json({ headers: filtered, now: new Date().toISOString() })
})

export default router
