
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { PregnenoloneConsent, PregnenolonePlanCreate, PregnenoloneDoseLog, PregnenoloneQueryRange } from '../schema/pregnenolone'
import { createPregnenolonePlan, acceptPregnenoloneConsent, logPregnenoloneDose, getPregnenoloneDoses, summarizePregnenolone } from '../services/pregnenolone.service'
import { requireApiKey } from '../middleware/apiKey'
import { perKeyRateLimiter } from '../middleware/tierPricing'
import { idempotency } from '../middleware/idempotency'
import { createBackpressure } from '../middleware/backpressure'
import { clampPageLimit } from '../lib/pagination'
import { parseOrError } from '../lib/validation'

const router = Router()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))

function ensureEnabled(req:any,res:any,next:any){
  const enabled = (process.env.PREGNENOLONE_FEATURE_ENABLED || 'true').toLowerCase()==='true'
  if(!enabled) return res.status(404).json({ error:'feature_disabled' })
  next()
}

router.use(ensureEnabled, requireApiKey(), perKeyRateLimiter())

// Create plan (draft)
router.post('/api/supplements/pregnenolone/plan', async (req, res) => {
  const data = parseOrError(PregnenolonePlanCreate, req.body)
  const plan = await createPregnenolonePlan(req.user.id, data)
  res.json({ plan })
})

// Accept consent (activate)
router.post('/api/supplements/pregnenolone/consent/:planId', async (req, res) => {
  const _ok = parseOrError(PregnenoloneConsent, { accept: true, acceptedAt: new Date().toISOString() })
  const plan = await acceptPregnenoloneConsent(String(req.params.planId))
  res.json({ plan })
})

// Log dose


function requireClinicianIfFlag(prisma:any){
  const gate = (process.env.SUPPL_REQUIRE_CLINICIAN_OK || 'false').toLowerCase()==='true'
  return async function(req:any, res:any, next:any){
    if (!gate) return next()
    const planId = String(req.body?.planId || req.params?.planId || '')
    if (!planId) return res.status(400).json({ error:'invalid_request', details:'planId required' })
    const plan = await prisma.supplementPlan.findUnique({ where: { id: planId }, select: { clinicianOk: true, userId: true } })
    if (!plan || plan.userId !== req.user.id) return res.status(404).json({ error:'not_found' })
    if (!plan.clinicianOk) return res.status(403).json({ error:'clinician_required' })
    return next()
  }
}

router.post('/api/supplements/pregnenolone/dose', idempotency(), backpressure, requireClinicianIfFlag(prisma), async (req, res) => {
  const data = parseOrError(PregnenoloneDoseLog, req.body)
  const dose = await logPregnenoloneDose(req.user.id, data)
  res.json({ dose })
})

// List doses (with pagination)
router.get('/api/supplements/pregnenolone/doses/:planId', async (req, res) => {
  const { page, limit, offset } = clampPageLimit(req.query)
  const { from, to } = parseOrError(PregnenoloneQueryRange, req.query) as any
  const list = await getPregnenoloneDoses(req.user.id, String(req.params.planId), { from: from? new Date(from): undefined, to: to? new Date(to): undefined })
  const doses = list.slice(offset, offset+limit)
  res.json({ page, limit, total: list.length, doses })
})

// Summary (+ optional AI text)
router.get('/api/supplements/pregnenolone/summary/:planId', requireClinicianIfFlag(prisma), async (req, res) => {
  const planId = String(req.params.planId)
  const base = await summarizePregnenolone(req.user.id, planId)
  const aiEnabled = (process.env.SUPPL_AI_SUMMARY_ENABLED || 'false').toLowerCase()==='true'
  const ai = aiEnabled ? "AI summary placeholder (wire aiClient)" : null
  res.json({ summary: base, ai, disclaimer: 'Informational only. Not medical advice.' })
})

export default router
