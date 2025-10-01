// src/routes/datasheet.ts
import { Router } from 'express'
import { idempotency } from '../middleware/idempotency'
import { createBackpressure } from '../middleware/backpressure'
import { apiKeyRateLimit } from '../middleware/apiKeyRateLimit' } from '../middleware/backpressure'
import { DataSheetRequestSchema } from '../schemas/datasheet'
import { suggestColumns } from '../ai/columns'
let Counter: any = null; try{ Counter = require('prom-client').Counter }catch{}
const dsCounter = Counter ? new Counter({ name:'datasheet_generate_total', help:'count of datasheet generations' }) : null
import { generateDataSheetPDF } from '../engine/pdfDatasheet'

const router = Router()
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))
let __inflight = 0
const __max = Number(process.env.DS_MAX_CONCURRENCY || 4)

/**
 * POST /api/admin/datasheet/pdf
 * body: { rows: any[], title?:string, columns?: string[] }
 */
router.post('/admin/datasheet/pdf', async (req, res)=>{ dsCounter?.inc();
  try{
    const { rows = [], title, columns } = req.body || {}
    if(!Array.isArray(rows) || rows.length===0) return res.status(400).json({ error:'rows_required' })
    // inflight guard
    if(__inflight >= __max) return res.status(429).json({ error:'busy' })
    __inflight++
    try{
      const file = await generateDataSheetPDF(rows, { title, columns })
    const fs = require('fs'); const crypto = require('crypto'); const data = fs.readFileSync(file); const checksum = crypto.createHash('sha256').update(data).digest('hex')
      let s3Url: string | null = null
      if(process.env.DS_S3_BUCKET){
        try{
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
          const cli = new S3Client({})
          const fs = require('fs')
          const path = require('path')
          const Key = `reports/${Date.now()}_${path.basename(file)}`
          await cli.send(new PutObjectCommand({ Bucket: process.env.DS_S3_BUCKET, Key, Body: fs.createReadStream(file), ContentType: 'application/pdf' }))
          if(process.env.DS_S3_CDN) s3Url = `${process.env.DS_S3_CDN.replace(/\/$/,'')}/${Key}`
        }catch{}
      }
      return res.json({ ok:true, file, s3Url })
    } finally {
      __inflight--
    }
    let s3Url: string | null = null
    if(process.env.DS_S3_BUCKET){
      try{
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
        const cli = new S3Client({})
        const fs = require('fs')
        const path = require('path')
        const Key = `reports/${Date.now()}_${path.basename(file)}`
        await cli.send(new PutObjectCommand({ Bucket: process.env.DS_S3_BUCKET, Key, Body: fs.createReadStream(file), ContentType: 'application/pdf' }))
        const cdn = process.env.DS_S3_CDN || ''
        s3Url = cdn ? `${cdn.replace(/\/$/,'')}/${Key}` : `s3://${process.env.DS_S3_BUCKET}/${Key}`
      }catch{}
    }
    return res.json({ ok:true, file, s3Url })
  }catch(e:any){
    return res.status(500).json({ error:e?.message || 'pdf_error' })
  }
})

export default router
