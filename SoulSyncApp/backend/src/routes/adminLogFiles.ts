import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { LOG_FILE_PATH } from '../logger'

const router = Router()

router.get('/logfiles/current', async (_req,res)=>{
  try{
    if(!fs.existsSync(LOG_FILE_PATH)) return res.status(404).json({ error:'log file not found' })
    res.setHeader('Content-Type','text/plain')
    res.setHeader('Content-Disposition','attachment; filename="app.log"')
    fs.createReadStream(LOG_FILE_PATH).pipe(res)
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

export default router
