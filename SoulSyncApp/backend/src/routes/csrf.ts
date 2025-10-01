import { Router } from 'express'
import { randomUUID } from 'crypto'

const r = Router()
r.get('/csrf-token', (_req, res) => {
  const token = randomUUID()
  res.cookie('csrfToken', token, { httpOnly: false, sameSite: 'strict', path:'/' })
  res.json({ csrfToken: token })
})
export default r
