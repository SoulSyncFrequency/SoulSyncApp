import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, User } from './db/index.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' })
  const exists = await findUserByEmail(String(email))
  if (exists) return res.status(409).json({ ok: false, error: 'EMAIL_EXISTS' })
  const passwordHash = await bcrypt.hash(password, 10)
  const id = Math.random().toString(36).slice(2)
  const user: User = { id, email, passwordHash, createdAt: new Date().toISOString() }
  await createUser(user)
  const token = jwt.sign({ sub: id, email }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ ok: true, token })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' })
  const user = await findUserByEmail(String(email))
  if (!user) return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' })
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ ok: true, token })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: 'NO_TOKEN' })
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown
    res.json({ ok: true, user: { id: payload.sub, email: payload.email } })
  } catch {
    res.status(401).json({ ok: false, error: 'INVALID_TOKEN' })
  }
})

export default router
