import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination';
import { readAuditLast } from '../middleware/audit';
import { requireRole } from '../middleware/requireRole';
import { prisma } from '../db/prismaClient';

const router = Router();

router.get('/admin/audit', requireRole(['ADMIN']), async (req, res)=>{
  const limit = Number(req.query.limit||200);
  const q = (req.query.q||'').toString();
  if (prisma) {
    const logs = await prisma.auditLog.findMany({ where: q? { OR:[ {path:{contains:q}}, {method:{contains:q}}, {user:{contains:q}} ] } : undefined, orderBy: { ts: 'desc' }, take: limit });
    return res.json({ lines: logs });
  }
  res.json({ lines: readAuditLast(200) });
});

export default router;


router.post('/admin/audit/summarize', requireRole('viewer'), async (req, res)=>{
  if(process.env.AUDIT_AI_SUMMARY !== '1') return res.status(404).json({ ok:false, error:'ai_disabled' })
  if(!process.env.OPENAI_API_KEY) return res.status(400).json({ ok:false, error:'no_openai_key' })
  try{
    const paths: string[] = Array.isArray(req.body?.paths) ? req.body.paths.slice(0, 10) : []
    if(paths.length===0) return res.status(400).json({ ok:false, error:'no_paths' })
    const fs = require('fs'); const path = require('path')
    let text = ''
    for(const p of paths){
      if(!/^audit\//.test(p)) return res.status(400).json({ ok:false, error:'bad_path', p })
      const full = path.join(process.cwd(), p)
      if(fs.existsSync(full)){ text += fs.readFileSync(full, 'utf-8') + '\n' }
    }
    const prompt = `Summarize the following audit JSON documents into 5 concise bullet points (Croatian). Focus on what changed, why, and potential impact. Use simple language.\n\n` + text.slice(0, 8000)
    const { fetchWithTimeout } = require('../utils/http');
    const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages:[{ role:'user', content: prompt }], temperature: 0.2 })
    })
    const data = await resp.json()
    const summary = data?.choices?.[0]?.message?.content || ''
    return res.json({ ok:true, summary })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})


router.get('/admin/audit/search', requireRole('viewer'), (req, res)=>{
  const q = (req.query.q as string) || ''
  const since = req.query.since ? new Date(String(req.query.since)) : null
  const until = req.query.until ? new Date(String(req.query.until)) : null
  const fs = require('fs'); const path = require('path')
  const base = path.join(process.cwd(), 'audit')
  const out:any[] = []
  function walk(dir:string){
    for(const name of fs.readdirSync(dir)){
      const p = path.join(dir, name)
      const st = fs.statSync(p)
      if(st.isDirectory()) walk(p)
      else if(/\.json$/i.test(name)){
        if(since && st.mtime < since) continue
        if(until && st.mtime > until) continue
        try{
          const text = fs.readFileSync(p, 'utf-8')
          if(!q || text.includes(q)) out.push({ path: 'audit/'+path.relative(base, p).replace(/\\/g,'/'), mtime: st.mtimeMs })
        }catch{}
      }
    }
  }
  if(fs.existsSync(base)) walk(base)
  res.json({ ok:true, hits: out.slice(0, 200) })
})

router.get('/admin/audit/export.tgz', requireRole('viewer'), (req, res)=>{
  const collection = (req.query.collection as string) || ''
  const id = (req.query.id as string) || ''
  const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const tar = require('tar-stream')
  const base = path.join(process.cwd(), 'audit')
  let dir = base
  if(collection) dir = path.join(dir, collection)
  if(id) dir = path.join(dir, id)
  if(!fs.existsSync(dir)) return res.status(404).json({ ok:false, error:'not_found' })
  res.setHeader('content-type','application/gzip')
  res.setHeader('content-disposition', `attachment; filename="audit_export.tgz"`)
  const pack = tar.pack(); const gzip = zlib.createGzip(); pack.pipe(gzip).pipe(res)
  function addDir(d:string, rel:string=''){
    for(const name of fs.readdirSync(d)){
      const p = path.join(d, name); const st = fs.statSync(p)
      if(st.isDirectory()){ pack.entry({ name: rel+name+'/', type:'directory' }); addDir(p, rel+name+'/') }
      else { const entry = pack.entry({ name: rel+name, size: st.size, type:'file' }, (err:any)=>{ if(err){} }); fs.createReadStream(p).pipe(entry) }
    }
  }
  addDir(dir, ''); pack.finalize()
})


router.post('/admin/audit/exportSelected.tgz', requireRole('viewer'), (req, res)=>{
  const list: string[] = Array.isArray(req.body?.paths) ? req.body.paths.slice(0, 500) : []
  if(list.length===0) return res.status(400).json({ ok:false, error:'no_paths' })
  const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const tar = require('tar-stream')
  res.setHeader('content-type','application/gzip')
  res.setHeader('content-disposition', `attachment; filename="audit_selected.tgz"`)
  const pack = tar.pack(); const gzip = zlib.createGzip(); pack.pipe(gzip).pipe(res)
  for(const p of list){
    if(!/^audit\//.test(p)) continue
    const fp = path.join(process.cwd(), p)
    if(!fs.existsSync(fp)) continue
    const st = fs.statSync(fp)
    const entry = pack.entry({ name: p.replace(/^audit\//,''), size: st.size, type:'file' }, (err:any)=>{ if(err){} })
    fs.createReadStream(fp).pipe(entry)
  }
  pack.finalize()
})


/** Build tgz for a directory and upload to S3 (if aws-sdk present). */
router.get('/admin/audit/exportUpload', requireRole('viewer'), async (req, res)=>{
  const collection = (req.query.collection as string) || ''
  const id = (req.query.id as string) || ''
  const bucket = process.env.STATS_S3_BUCKET || process.env.DS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  let AWS:any = null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const tar = require('tar-stream')
  const base = path.join(process.cwd(), 'audit')
  let dir = base; if(collection) dir = path.join(dir, collection); if(id) dir = path.join(dir, id)
  if(!fs.existsSync(dir)) return res.status(404).json({ ok:false, error:'not_found' })
  const tmp = path.join(process.cwd(), 'tmp'); fs.mkdirSync(tmp, { recursive: true })
  const outPath = path.join(tmp, `audit_${Date.now()}.tgz`)
  await new Promise<void>((resolve, reject)=>{
    const pack = tar.pack(); const gzip = zlib.createGzip(); const out = fs.createWriteStream(outPath)
    pack.pipe(gzip).pipe(out)
    function addDir(d:string, rel=''){
      for(const name of fs.readdirSync(d)){
        const p = path.join(d,name); const st = fs.statSync(p)
        if(st.isDirectory()){ pack.entry({ name: rel+name+'/', type:'directory' }); addDir(p, rel+name+'/') }
        else { const entry = pack.entry({ name: rel+name, size: st.size, type:'file' }, (err:any)=>{ if(err) reject(err) }); fs.createReadStream(p).pipe(entry) }
      }
    }
    addDir(dir); pack.finalize(); out.on('finish', ()=> resolve()); out.on('error', reject)
  })
  try{
    const s3 = new AWS.S3()
    const Key = 'audit/' + require('path').basename(outPath)
    const Body = require('fs').readFileSync(outPath)
    await s3.putObject({ Bucket: bucket, Key, Body, ContentType: 'application/gzip' }).promise()
    const cdn = process.env.DS_S3_CDN || ''
    const s3Url = cdn ? (cdn.replace(/\/$/,'') + '/' + Key) : (`https://${bucket}.s3.amazonaws.com/`+Key)
    try{ fs.unlinkSync(outPath) }catch{}
    return res.json({ ok:true, s3Url, key: Key })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

/** Build tgz from selected audit/ paths and upload to S3 */
router.post('/admin/audit/exportSelectedUpload', requireRole('viewer'), async (req, res)=>{
  const list: string[] = Array.isArray(req.body?.paths) ? req.body.paths.slice(0, 500) : []
  if(list.length===0) return res.status(400).json({ ok:false, error:'no_paths' })
  const bucket = process.env.STATS_S3_BUCKET || process.env.DS_S3_BUCKET
  if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
  let AWS:any = null; try{ AWS = require('aws-sdk') }catch{}
  if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })
  const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const tar = require('tar-stream')
  const tmp = path.join(process.cwd(), 'tmp'); fs.mkdirSync(tmp, { recursive: true })
  const outPath = path.join(tmp, `audit_sel_${Date.now()}.tgz`)
  await new Promise<void>((resolve, reject)=>{
    const pack = tar.pack(); const gzip = zlib.createGzip(); const out = fs.createWriteStream(outPath)
    pack.pipe(gzip).pipe(out)
    for(const p of list){
      if(!/^audit\//.test(p)) continue
      const fp = path.join(process.cwd(), p); if(!fs.existsSync(fp)) continue
      const st = fs.statSync(fp)
      const entry = pack.entry({ name: p.replace(/^audit\//,''), size: st.size, type:'file' }, (err:any)=>{ if(err) reject(err) })
      fs.createReadStream(fp).pipe(entry)
    }
    pack.finalize(); out.on('finish', ()=> resolve()); out.on('error', reject)
  })
  try{
    const s3 = new AWS.S3()
    const Key = 'audit/' + require('path').basename(outPath)
    const Body = require('fs').readFileSync(outPath)
    await s3.putObject({ Bucket: bucket, Key, Body, ContentType: 'application/gzip' }).promise()
    const cdn = process.env.DS_S3_CDN || ''
    const s3Url = cdn ? (cdn.replace(/\/$/,'') + '/' + Key) : (`https://${bucket}.s3.amazonaws.com/`+Key)
    try{ fs.unlinkSync(outPath) }catch{}
    return res.json({ ok:true, s3Url, key: Key })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})


router.post('/admin/audit/review', requireRole('viewer'), async (req, res)=>{
  if(process.env.AUDIT_AI_REVIEW!=='1') return res.status(404).json({ ok:false, error:'ai_disabled' })
  if(!process.env.OPENAI_API_KEY) return res.status(400).json({ ok:false, error:'no_openai_key' })
  try{
    const fs = require('fs'); const path = require('path')
    const dir = path.join(process.cwd(),'audit','admin_actions')
    let files:string[] = []
    if(fs.existsSync(dir)){
      for(const day of fs.readdirSync(dir).sort().slice(-14)){ // last ~2 weeks
        const d = path.join(dir, day)
        if(fs.statSync(d).isDirectory()){
          for(const f of fs.readdirSync(d)) files.push(path.join(d,f))
        }
      }
    }
    files = files.slice(-200) // cap
    let text = ''
    for(const f of files){ try{ text += fs.readFileSync(f,'utf-8') + '\n' }catch{} }
    if(!text) return res.status(404).json({ ok:false, error:'no_data' })
    const { fetchWithTimeout } = require('../utils/http')
    const prompt = `Analiziraj sljedeće admin akcije (JSON zapis po liniji). Daj 6 kratkih bullet točaka (hrvatski): trendovi, anomalije, rizične akcije (po roli), i preporuke.\n\n` + text.slice(0, 8000)
    const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+process.env.OPENAI_API_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages:[{ role:'user', content: prompt }], temperature: 0.2 })
    }, 15000)
    const data = await resp.json()
    const summary = data?.choices?.[0]?.message?.content || ''
    return res.json({ ok:true, summary })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})
