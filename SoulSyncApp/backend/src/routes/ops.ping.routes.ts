
import { Router } from 'express'
const router = Router()
router.get('/ops/ping', (_req, res) => res.status(204).end())
export default router
