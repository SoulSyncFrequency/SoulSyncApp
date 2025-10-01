
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const router = Router()

router.get('/openapi.hash', (_req, res) => {
  const p = path.join(process.cwd(),'backend','openapi','openapi.json')
  try{
    const buf = fs.readFileSync(p)
    const hash = crypto.createHash('sha256').update(buf).digest('hex')
    const stat = fs.statSync(p)
    res.setHeader('ETag', hash)
    res.setHeader('Last-Modified', stat.mtime.toUTCString())
    res.json({ ok:true, sha256: hash, bytes: buf.length, lastModified: stat.mtime.toISOString() })
  }catch(e:any){
    res.status(404).json({ error:'not_found' })
  }
})

export default router
