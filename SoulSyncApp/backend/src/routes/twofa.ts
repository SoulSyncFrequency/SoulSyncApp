import { Router } from 'express'
import { featureFlag } from '../lib/flags'
import { generateSecret, verifyTOTP } from '../lib/totp'
import { requireRole } from '../middleware/rbac'

const r = Router()

r.post('/api/v1/2fa/enroll', requireRole('admin'), (req, res) => {
  if (!featureFlag('2FA')) return res.status(403).json({ error: { code:'forbidden', message:'Feature disabled' } })
  const sec = generateSecret('SoulSync 2FA')
  // In real app, persist sec.base32 per-user; here we just return for demo
  res.json({ otpauth: sec.otpauth_url, base32: sec.base32 })
})

r.post('/api/v1/2fa/verify', requireRole('admin'), (req, res) => {
  if (!featureFlag('2FA')) return res.status(403).json({ error: { code:'forbidden', message:'Feature disabled' } })
  const { secret, token } = req.body || {}
  const ok = secret && token && verifyTOTP(secret, token)
  if (!ok) return res.status(400).json({ error:{ code:'invalid_totp', message:'Invalid token' } })
  res.json({ ok: true })
})

export default r
