
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const router = Router()

router.get('/ops/version', (_req, res) => {
  let version = 'unknown'
  try{
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(),'backend','package.json'),'utf-8'))
    version = pkg.version || 'unknown'
  }catch{}
  let openapiHash = 'unknown'
  try{
    const buf = fs.readFileSync(path.join(process.cwd(),'backend','openapi','openapi.json'))
    openapiHash = crypto.createHash('sha256').update(buf).digest('hex')
  }catch{}
  res.json({ ok:true, version, openapiSha256: openapiHash })
})

export default router
