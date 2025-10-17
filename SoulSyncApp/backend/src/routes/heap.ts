import { Router } from 'express'
import { requireRole } from '../middleware/apiKeyAuth'
const router = Router()

router.get('/admin/heapdump', requireRole('admin'), (req, res)=>{
  if(process.env.HEAPDUMP !== '1') return res.status(404).json({ ok:false, error:'heapdump_disabled' })
  try{
    const v8 = require('v8'); const fs = require('fs'); const path = require('path')
    if(!v8 || !v8.writeHeapSnapshot) return res.status(501).json({ ok:false, error:'not_supported' })
    const dir = path.join(process.cwd(), 'tmp'); fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, 'heap_'+Date.now()+'.heapsnapshot')
    v8.writeHeapSnapshot(file)
    res.setHeader('content-type','application/octet-stream')
    res.setHeader('content-disposition', 'attachment; filename="'+path.basename(file)+'"')
    return res.sendFile(file)
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router
