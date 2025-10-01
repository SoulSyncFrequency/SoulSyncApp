
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/admin/audit/export', (req, res) => {
  const file = String(req.query.file || 'admin_audit.ndjson')
  const p = path.join(process.cwd(), 'logs', file)
  if (!fs.existsSync(p)) return res.status(404).json({ error:'not_found' })
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`)
  fs.createReadStream(p).pipe(res)
})

export default router
