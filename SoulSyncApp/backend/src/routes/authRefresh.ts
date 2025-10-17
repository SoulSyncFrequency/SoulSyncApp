import { Router } from 'express'
import { authLimiter } from '../middleware/rateLimit'
import { verifyRefreshToken, signAccessToken, signRefreshTokenWithJti } from '../auth/jwt'
import { randomUUID } from 'crypto'
import { doubleSubmitCsrf } from '../middleware/csrf'
import { userRateLimit } from '../middleware/userRateLimit'

const r = Router()

r.post('/auth/refresh', doubleSubmitCsrf, userRateLimit('refresh', Number(process.env.USER_RL_MAX||120), Number(process.env.USER_RL_WINDOW_SEC||60)), authLimiter, (req, res) => {
  const { refreshToken } = req.body || {}; const old = refreshToken
  if (!refreshToken) return res.status(400).json({ error: { code:'bad_request', message:'missing refreshToken' } })
  try {
    const payload = verifyRefreshToken(refreshToken) as any

const jti = (payload as any).jti as string | undefined
if (!jti) return res.status(401).json({ error: { code:'invalid_token', message:'missing jti' } })
const { isRefreshValid, revokeRefreshToken, issueRefreshToken } = await import('../auth/tokenStore')
const valid = await isRefreshValid(jti)
if (!valid) return res.status(401).json({ error: { code:'invalid_token', message:'revoked or expired' } })
await revokeRefreshToken(jti)
const { jti: newJti } = await issueRefreshToken(payload.id, payload.role)
const newRefresh = signRefreshTokenWithJti({ id: payload.id, role: payload.role }, newJti)
res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: process.env.NODE_ENV==='production' ? 'strict' : 'lax', path: '/' });
    // rotate CSRF token too
    const csrf = randomUUID();
    res.cookie('csrfToken', csrf, { httpOnly: false, sameSite: 'strict', path: '/' })

    const access = signAccessToken({ id: payload.id, role: payload.role })
    return res.json({ accessToken: access })
  } catch (e:any){
    return res.status(401).json({ error: { code:'invalid_token', message: e?.message } })
  }
})

export default r
