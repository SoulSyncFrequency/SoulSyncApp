
import { Router } from 'express'
import url from 'url'
import http from 'http'
import https from 'https'

const router = Router()

router.get('/ops/ping-s3', async (_req, res) => {
  try{
    const target = process.env.S3_BUCKET_URL
    if(!target) return res.status(503).json({ error:'s3_not_configured' })
    const u = new url.URL(target)
    const mod = u.protocol==='https:'? https: http
    await new Promise((resolve, reject)=>{
      const r = mod.request({ method:'HEAD', hostname:u.hostname, path:u.pathname||'/', port:u.port||undefined }, (resp)=>{ resp.resume(); resolve(true as any) })
      r.on('error', reject); r.setTimeout(2000, ()=>{ r.destroy(new Error('s3_timeout')) })
      r.end()
    })
    res.status(204).end()
  }catch(e:any){
    res.status(503).json({ error:'s3_unavailable', message:String(e?.message||e) })
  }
})

export default router
