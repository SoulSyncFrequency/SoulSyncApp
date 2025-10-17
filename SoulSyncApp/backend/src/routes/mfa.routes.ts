import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'

const r = Router()

r.post('/auth/mfa/step-up/initiate', requireAuth, async (req, res) => {
  // In production: send TOTP challenge or WebAuthn assertion here.
  // For now we just respond that verification is needed.
  res.json({ ok:true, method: 'totp_or_passkey' })
})

r.post('/auth/mfa/step-up/verify', requireAuth, async (req, res) => {
  const { code } = req.body || {}
  // DEV fallback: accept any 6-digit code if MFA_STEPUP_DEV_ACCEPT_ALL=true
  const dev = process.env.MFA_STEPUP_DEV_ACCEPT_ALL === 'true'
  const pass = dev ? (typeof code === 'string' && code.length === 6) : false
  if(!pass) return res.status(400).json({ error:{ code:'invalid_code', message:'Verification failed' } })
  const sess: any = (req as any).session || {}
  sess.mfaStepUp = { ok:true, ts: Date.now() }
  res.json({ ok:true, ttlMs: Number(process.env.MFA_STEPUP_TTL_MS||600000) })
})

export default r
