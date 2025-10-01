import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { gateFeature } from '../config/flags'
import { guardedJSON, Shape } from '../ai/guard'

const r = Router()
r.post('/ai/guarded', gateFeature('aiGuard'), requireAuth, async (req,res)=>{
  const { prompt='', shape, attempts=2 } = req.body || {}
  if(!shape || typeof shape!=='object') return res.status(400).json({ error:{ code:'bad_request', message:'shape required' } })
  const result = await guardedJSON(prompt, shape as Shape, Math.min(Math.max(Number(attempts||2),1),3))
  res.json(result)
})
export default r
