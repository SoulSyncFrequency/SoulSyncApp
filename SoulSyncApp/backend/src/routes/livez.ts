import { Router } from 'express'
const r = Router()
r.get('/livez', (_req, res) => res.status(200).send('ok'))
r.get('/healthz', (_req, res) => res.status(200).send('ok'))
export default r
