import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { requireRole } from '../middleware/apiKeyAuth'
import { readTail } from '../middleware/logsTail'

const router = Router()

router.get('/admin/logs/tail', requireRole('viewer'), (req,res)=>{
  const limit = Number(req.query.limit || 100)
  res.json({ ok:true, items: readTail(limit) })
})


router.post('/admin/logs/export', requireRole('viewer'), (req,res)=>{
  try{
    const limit = Number(req.query.limit || 500)
    const items = readTail(limit)
    const base = require('path').join(process.cwd(), 'stats')
    const fs = require('fs'); fs.mkdirSync(base, { recursive:true })
    const fn = require('path').join(base, 'tail_'+Date.now()+'.jsonl')
    const out = items.map((x:any)=> JSON.stringify(x)).join('\n') + '\n'
    fs.writeFileSync(fn, out)
    return res.json({ ok:true, file: 'stats/'+require('path').basename(fn) })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

router.post('/admin/logs/clear', requireRole('viewer'), (_req,res)=>{
  try{
    // mutate ring via readTail + splice trick: not accessible; expose via global
    const tail = require('../middleware/logsTail')
    if(tail && tail.__clear){ tail.__clear() }
    return res.json({ ok:true })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router

