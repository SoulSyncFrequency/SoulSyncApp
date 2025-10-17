
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { clampPageLimit } from '../lib/pagination'
import { ProgestEConsent, ProgestEPlanCreate, ProgestEDoseLog, ProgestEQueryRange } from '../schema/progeste'
import { parseOrError } from '../lib/validation'
import { createProgestEPlan, acceptProgestEConsent, logProgestEDose, getProgestEDoses, summarizeAdherenceAndSymptoms } from '../services/progeste.service'
import { requireApiKey } from '../middleware/apiKey'
import { perKeyRateLimiter } from '../middleware/tierPricing'
import { idempotency } from '../middleware/idempotency'
import { createBackpressure } from '../middleware/backpressure'

const router = Router()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))

function ensureEnabled(req:any,res:any,next:any){
  const enabled = (process.env.PROGESTE_FEATURE_ENABLED || 'true').toLowerCase()==='true'
  if(!enabled) return res.status(404).json({ error:'feature_disabled' })
  next()
}

router.use(ensureEnabled, requireApiKey(), perKeyRateLimiter())

router.post('/api/supplements/progeste/plan', async (req, res) => {
  const parsed = ProgestEPlanCreate.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error:'invalid_request', details: parsed.error.issues })
  const plan = await createProgestEPlan(req.user.id, parsed.data)
  res.json({ plan })
})

router.post('/api/supplements/progeste/consent/:planId', async (req, res) => {
  const ok = ProgestEConsent.safeParse({ accept:true })
  if(!ok.success) return res.status(400).json({ error:'invalid_request' })
  const plan = await acceptProgestEConsent(String(req.params.planId))
  res.json({ plan })
})



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

router.post('/api/supplements/progeste/dose', idempotency(), backpressure, requireClinicianIfFlag(prisma), async (req, res) => {
  const parsed = ProgestEDoseLog.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error:'invalid_request', details: parsed.error.issues })
  const dose = await logProgestEDose(req.user.id, parsed.data)
  res.json({ dose })
})

router.get('/api/supplements/progeste/doses/:planId', async (req, res) => {
  const planId = String(req.params.planId)
  const parsed = ProgestEQueryRange.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error:'invalid_request', details: parsed.error.issues })
  const doses = await getProgestEDoses(req.user.id, planId, { from: parsed.data.from? new Date(parsed.data.from): undefined, to: parsed.data.to? new Date(parsed.data.to): undefined })
  res.json({ doses })
})

router.get('/api/supplements/progeste/summary/:planId', requireClinicianIfFlag(prisma), async (req, res) => {
  const base = await summarizeAdherenceAndSymptoms(req.user.id, String(req.params.planId))
  const aiEnabled = (process.env.SUPPL_AI_SUMMARY_ENABLED || 'false').toLowerCase()==='true'
  const ai = aiEnabled ? "AI summary placeholder (wire your aiClient here)" : null
  res.json({ summary: base, ai, disclaimer: 'Informational only. Not medical advice.' })
})

export default router
