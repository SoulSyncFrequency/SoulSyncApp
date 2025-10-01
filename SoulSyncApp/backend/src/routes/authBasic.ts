import { Router } from 'express'
import { z } from 'zod'
import { accountLimiter } from '../middleware/rateLimitAccount'
import { authLimiter } from '../middleware/rateLimit'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshTokenWithJti } from '../auth/jwt'
import { issueRefreshToken, revokeRefreshToken } from '../auth/tokenStore'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const r = Router()
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12)
const LOGIN_MAX_FAILS = Number(process.env.LOGIN_MAX_FAILS || 5)
const LOGIN_BLOCK_MINUTES = Number(process.env.LOGIN_BLOCK_MINUTES || 15)
const LOGIN_WINDOW_MINUTES = Number(process.env.LOGIN_WINDOW_MINUTES || 15)

function cookieOpts(){
  const prod = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'strict' as const : 'lax' as const,
    path: '/'
  }
}

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128), role: z.string().optional() })

r.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body || {})
    if (!parsed.success) return res.status(400).json({ error: { code:'bad_request', details: parsed.error.flatten() } })
    const { email, password, role } = parsed.data
    if (!email || !password) return res.status(400).json({ error: { code: 'bad_request', message: 'email/password required' } })
    const hash = await bcrypt.hash(password, bcryptRounds)
    const user = await prisma.user.create({ data: { email, passwordHash: hash, role: role || 'user' } })
    return res.json({ id: user.id, email: user.email, role: user.role })
  } catch (e:any){
    if (String(e?.message || '').includes('Unique constraint')){
      return res.status(409).json({ error: { code: 'conflict', message: 'email taken' } })
    }
    return res.status(500).json({ error: { code:'server_error' } })
  }
})

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

r.post('/auth/login', authLimiter, accountLimiter('login', Number(process.env.RL_LOGIN_MAX||10), Number(process.env.RL_LOGIN_WINDOW_SEC||60)), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: { code:'bad_request', details: parsed.error.flatten() } })
  const { email, password } = parsed.data
  if (!email || !password) return res.status(400).json({ error: { code: 'bad_request' } })
  const user = await prisma.user.findUnique({ where: { email } })
  const now = new Date()
  const rec = await prisma.failedLogin.findUnique({ where: { email } })
  if (rec && rec.blockedUntil && rec.blockedUntil > now){
    return res.status(423).json({ error: { code: 'account_locked', until: rec.blockedUntil } })
  }
  if (!user) return res.status(401).json({ error: { code: 'invalid_credentials' } })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: { code: 'invalid_credentials' } })
  await prisma.failedLogin.delete({ where: { email } }).catch(()=>{})
  const accessToken = signAccessToken({ id: user.id, role: user.role })
  const { jti } = await issueRefreshToken(user.id, user.role)
  const refreshToken = signRefreshTokenWithJti({ id: user.id, role: user.role }, jti)
  res.cookie('refreshToken', refreshToken, cookieOpts())
  return res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role } })
})

r.post('/auth/logout', authLimiter, (req, res) => {
  try {
    const rt = (req.cookies && req.cookies.refreshToken) || null
    if (rt) {
      const parts = rt.split('.')
      if (parts.length===3){
        const body = JSON.parse(Buffer.from(parts[1],'base64').toString())
        if (body && body.jti) await revokeRefreshToken(body.jti)
      }
    }
  } catch {}
  res.clearCookie('refreshToken', { path: '/' })
  res.json({ ok: true })
})

export default r
