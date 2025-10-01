import { Router } from 'express'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

const router = Router()

function sign(key:string, exp:number){
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'dev-secret'
  const data = key + ':' + exp
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return { exp, sig }
}
function verify(key:string, exp:number, sig:string){
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'dev-secret'
  const data = key + ':' + exp
  const expect = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))
}
function safePath(p:string){
  const root = path.join(process.cwd())
  const abs = path.join(root, p)
  if(!abs.startsWith(root)) throw new Error('bad_path')
  return abs
}

// Admin: get token for local file (when S3 not in use)
router.get('/admin/reports/token', (req, res)=>{
  const key = (req.query.key as string) || ''
  if(!key || !/^reports\//.test(key)) return res.status(400).json({ ok:false, error:'bad_key' })
  const exp = Date.now() + 5*60*1000
  const { sig } = sign(key, exp)
  return res.json({ ok:true, url: `/dl?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sig}` })
})

// Public download (token-guarded)
router.get('/dl', (req, res)=>{
  const key = (req.query.key as string) || ''
  const exp = Number(req.query.exp || 0)
  const sig = (req.query.sig as string) || ''
  if(!key || !/^reports\//.test(key)) return res.status(400).json({ ok:false, error:'bad_key' })
  if(!exp || !sig || Date.now() > exp) return res.status(401).json({ ok:false, error:'expired' })
  if(!verify(key, exp, sig)) return res.status(401).json({ ok:false, error:'bad_sig' })
  try{
    const fp = safePath(key)
    if(!fs.existsSync(fp)) return res.status(404).json({ ok:false, error:'not_found' })
    return res.sendFile(fp)
  }catch(e:any){
    return res.status(400).json({ ok:false, error: e?.message })
  }
})

export default router
