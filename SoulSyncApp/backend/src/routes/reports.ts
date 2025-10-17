import { Router } from 'express'
import { idempotency } from '../middleware/idempotency'
import { createBackpressure } from '../middleware/backpressure'
import { apiKeyRateLimit } from '../middleware/apiKeyRateLimit' } from '../middleware/backpressure'
const router = Router()
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))
import path from 'path'
import fs from 'fs'
import { requireRole } from '../middleware/apiKeyAuth'

router.get('/admin/reports/upload', requireRole('viewer'), async (req, res)=>{
  const rel = (req.query.file as string)||''
  const bucket = process.env.DS_S3_BUCKET || process.env.STATS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  let AWS:any=null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  const base = path.join(process.cwd(), 'reports')
  const fp = path.join(base, rel)
  if(!fp.startsWith(base)) return res.status(400).json({ ok:false, error:'bad_path' })
  if(!fs.existsSync(fp)) return res.status(404).json({ ok:false, error:'not_found' })
  const body = fs.readFileSync(fp)
  const ext = path.extname(fp).toLowerCase()
  const ct = ext==='.pdf' ? 'application/pdf' : 'application/octet-stream'
  const s3 = new AWS.S3()
  const Key = 'reports/'+rel.replace(/\\/g,'/')
  await s3.putObject({ Bucket: bucket, Key, Body: body, ContentType: ct }).promise()
  const cdn = process.env.DS_S3_CDN || ''
  const s3Url = cdn ? (cdn.replace(/\/$/,'') + '/' + Key) : (`https://${bucket}.s3.amazonaws.com/`+Key)
  return res.json({ ok:true, s3Url, key: Key })
})

import path from 'path'
import fs from 'fs'
import { sign, verify } from '../utils/signer'

router.get('/admin/reports/sign', async (req, res)=>{
  const key = (req.query.key as string) || ''
  if(!key || !/^reports\//.test(key)) return res.status(400).json({ ok:false, error:'bad_key' })
  // Prefer S3 presign if configured
  if(process.env.DS_S3_BUCKET){
    try{
      const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
      const cli = new S3Client({})
      const url = await getSignedUrl(cli, new GetObjectCommand({ Bucket: process.env.DS_S3_BUCKET, Key: key }), { expiresIn: 300 })
      return res.json({ ok:true, url })
    }catch(e:any){
      return res.status(500).json({ ok:false, error:'presign_failed', detail: e?.message })
    }
  }
  // Fallback: local file path (secured by API key gate on /api/admin/*)
  const path = require('path'); const fs = require('fs')
  const fp = path.join(process.cwd(), key)
  if(!fs.existsSync(fp)) return res.status(404).json({ ok:false, error:'not_found' })
  return res.json({ ok:true, path: `/` + key.replace(/\\/g,'/') })
})

export default router


router.get('/admin/reports/download', (req, res)=>{
  const key = (req.query.key as string) || ''
  const exp = (req.query.exp as string) || ''
  const sig = (req.query.sig as string) || ''
  if(!key || !/^reports\//.test(key)) return res.status(400).json({ ok:false, error:'bad_key' })
  if(!exp || !sig) return res.status(400).json({ ok:false, error:'missing_params' })
  if(Date.now() > Number(exp)) return res.status(410).json({ ok:false, error:'expired' })
  if(!verify({ key, exp }, sig)) return res.status(403).json({ ok:false, error:'bad_sig' })
  const fp = path.join(process.cwd(), key)
  if(!fs.existsSync(fp)) return res.status(404).json({ ok:false, error:'not_found' })
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fp)}"`)
  res.sendFile(fp)
})
