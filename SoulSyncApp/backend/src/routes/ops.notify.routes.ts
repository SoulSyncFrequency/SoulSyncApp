
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'
import { notifyAll } from '../services/notifier'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.post('/admin/ops/notify', async (req, res) => {
  try{
    const subject = (req.body && req.body.subject) || 'Test notification'
    const body = (req.body && req.body.body) || 'This is a test notification from /admin/ops/notify.'
    const results = await notifyAll(subject, body)
    res.json({ ok: true, results })
  }catch(e:any){
    res.status(500).json({ error:'notify_failed', message:String(e?.message||e) })
  }
})

export default router
