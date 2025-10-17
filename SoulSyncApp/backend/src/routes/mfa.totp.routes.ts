import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { requireAuth } from '../middleware/requireAuth'

const r = Router()

/**
 * DEV-STUB: TOTP-like verify — in produkciji zamijeniti pravim TOTP/WebAuthn.
 * Prihvati 6-znamenkasti kod jednak zadnjim 6 znamenkama epohe (u sekundama) ±1 step.
 */
r.post('/auth/mfa/totp/verify', requireAuth, async (req:any,res)=>{
  const { code } = req.body || {}
  const sec = Math.floor(Date.now()/30_000) // 30s step
  const valid = [sec-1, sec, sec+1].some(s => String(s).slice(-6) === String(code||''))
  if(!valid) return res.status(400).json({ ok:false })
  const sess:any = (req as any).session || {}
  sess.mfaStepUp = { ok:true, ts: Date.now() }
  res.json({ ok:true })
})

export default r
