import { Router } from 'express'
import { requireAnyKey } from '../middleware/apiKeyAuth'
const router = Router()

router.get('/whoami', requireAnyKey(), (req:any,res:any)=>{
  const role = (res as any).locals?.role || (req as any).role || 'unknown'
  res.json({ ok:true, role })
})

export default router
