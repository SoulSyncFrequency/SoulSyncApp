
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/admin/ops/simulate', async (req, res) => {
  const type = String(req.query.type||'latency') // latency|error
  const ms = Math.max(0, Math.min(10000, Number(req.query.ms||'1000')))
  if (type==='latency'){
    await new Promise(r=>setTimeout(r, ms))
    return res.json({ ok:true, simulated:'latency', ms })
  }
  if (type==='error'){
    return res.status(500).json({ error:'simulated_error', note:'This is a test error for alerting pipelines.' })
  }
  res.json({ ok:true, note:'unknown type' })
})

export default router
