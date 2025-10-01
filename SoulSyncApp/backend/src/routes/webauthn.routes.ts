import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'

const r = Router()
const challenges = new Map<string,string>()

r.post('/auth/mfa/webauthn/register', requireAuth, async (req:any,res)=>{
  const userId = req.user?.id || 'anon'
  const challenge = Buffer.from(String(Date.now()) + Math.random().toString(36)).toString('base64url')
  challenges.set(userId, challenge)
  res.json({ rp:{ name:'SoulSync' }, user:{ id:userId, name:req.user?.email||'user' }, pubKeyCredParams:[{ type:'public-key', alg:-7 }], challenge })
})

r.post('/auth/mfa/webauthn/verify', requireAuth, async (req:any,res)=>{
  const userId = req.user?.id || 'anon'
  const { challenge } = req.body || {}
  const ok = !!challenge && challenge === challenges.get(userId)
  if(!ok) return res.status(400).json({ ok:false })
  (req as any).session = (req as any).session || {}
  ;(req as any).session.mfaStepUp = { ok:true, ts: Date.now(), factor:'webauthn' }
  res.json({ ok:true })
})

export default r
