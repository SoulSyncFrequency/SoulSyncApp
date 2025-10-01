import { Router } from 'express'
import { requireRole } from '../middleware/apiKeyAuth'
const router = Router()

router.get('/admin/s3/sign', requireRole('viewer'), async (req, res)=>{
  const bucket = process.env.DS_S3_BUCKET || process.env.STATS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  const key = String(req.query.key||'').replace(/^\//,'')
  if(!key) return res.status(400).json({ ok:false, error:'no_key' })
  let AWS:any=null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  try{
    const s3 = new AWS.S3()
    const ttl = Math.max(60, Math.min(Number(req.query.ttl||process.env.S3_SIGN_TTL||900), 3600))
    const params = { Bucket: bucket, Key: key, Expires: ttl }
    const url = s3.getSignedUrl('getObject', params)
    return res.json({ ok:true, url, ttl })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router


router.get('/admin/s3/signPut', requireRole('viewer'), async (req, res)=>{
  const bucket = process.env.DS_S3_BUCKET || process.env.STATS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  const key = String(req.query.key||'').replace(/^\//,'')
  if(!key) return res.status(400).json({ ok:false, error:'no_key' })
  let AWS:any=null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  try{
    const s3 = new AWS.S3()
    const ttl = Math.max(60, Math.min(Number(req.query.ttl||process.env.S3_SIGN_TTL||900), 3600))
    const params:any = { Bucket: bucket, Key: key, Expires: ttl, ContentType: String(req.query.contentType||'application/octet-stream') }
    const url = s3.getSignedUrl('putObject', params)
    return res.json({ ok:true, url, ttl })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})


router.post('/admin/s3/signPost', requireRole('viewer'), async (req, res)=>{
  const bucket = process.env.DS_S3_BUCKET || process.env.STATS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  let AWS:any=null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  const key = String(req.body?.key||'').replace(/^\//,'')
  const contentType = String(req.body?.contentType||'application/octet-stream')
  const ttl = Math.max(60, Math.min(Number(req.body?.ttl||process.env.S3_SIGN_TTL||900), 3600))
  if(!key) return res.status(400).json({ ok:false, error:'no_key' })
  try{
    const s3 = new AWS.S3()
    const policy = await new Promise<any>((resolve, reject)=>{
      s3.createPresignedPost({
        Bucket: bucket,
        Fields: { key, 'Content-Type': contentType },
        Conditions: [
          ["content-length-range", 1, 104857600], // up to 100MB
          {"Content-Type": contentType}
        ],
        Expires: ttl
      }, (err:any, data:any)=> err? reject(err): resolve(data))
    })
    return res.json({ ok:true, policy })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})
