
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { idempotency } from '../middleware/idempotency'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const router = Router()

router.use(adminAuth('admin'), requireRole('admin'))

// Toggle clinicianOk + optional note append
router.patch('/admin/supplements/progeste/plan/:planId/clinician-ok', idempotency(), async (req, res) => {
  const { ok, note } = (req.body || {})
  if (typeof ok !== 'boolean') return res.status(400).json({ error:'invalid_request', details:'ok:boolean required' })
  const planId = String(req.params.planId)
  const plan = await prisma.supplementPlan.update({
    where: { id: planId },
    data: { clinicianOk: ok, notes: note? (prisma.raw`concat(coalesce(notes,''), '\nAdmin: ', ${note})` as any) : undefined }
  })
  res.json({ plan })
})

// List/search plans
router.get('/admin/supplements/progeste/plans', async (req, res) => {
  const { userId, status } = (req.query || {}) as any
  const where:any = { type: 'PROGEST_E' }
  if (userId) where.userId = String(userId)
  if (status) where.status = String(status)
  const plans = await prisma.supplementPlan.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  res.json({ plans })
})

export default router
