import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import fs from 'fs'; import path from 'path'
import { requireAuth } from '../middleware/requireAuth'
import { ai } from '../services/ai'
import { ingest, search } from '../rag/vector'
import crypto from 'crypto'

const r = Router()
let loaded = false
function loadDocs(){
  if(loaded) return
  const roots:string[] = []
  const pub = path.join(process.cwd(), 'merge_v170/SoulSyncApp/frontend/public')
  const docsDir = path.join(process.cwd(), 'merge_v170/SoulSyncApp/docs/legacy')
  function addDir(dir:string){
    if(fs.existsSync(dir)){
      for(const f of fs.readdirSync(dir)){
        const full=path.join(dir,f)
        if(fs.statSync(full).isFile() && /\.(html|md|txt)$/i.test(f)){
          roots.push(full)
        }
      }
    }
  }
  addDir(pub); addDir(docsDir)
  const docs = roots.map((p,i)=> ({ id: String(i+1), text: fs.readFileSync(p,'utf8'), meta:{ path:p } }))
  ingest(docs); loaded = true
}
loadDocs()

type CacheEntry = { etag:string, body:any, ts:number }
const cache = new Map<string,CacheEntry>()
const CAP = 50

function setCache(key:string, val:CacheEntry){
  if(cache.size>=CAP){ const oldest=[...cache.keys()][0]; cache.delete(oldest) }
  cache.set(key,val)
}

r.post('/rag/query', requireAuth, async (req,res)=>{
  const q = String((req.body||{}).q||'').slice(0,1000)
  if(!q) return res.status(400).json({ error:{ code:'bad_request' } })
  const key = crypto.createHash('sha1').update(q).digest('hex')
  const now = Date.now()
  const hit = cache.get(key)
  if(hit && (now - hit.ts) < 5*60*1000){
    const inm = req.headers['if-none-match']
    if(inm && inm===hit.etag){ return res.status(304).end() }
    res.setHeader('ETag', hit.etag)
    return res.json(hit.body)
  }
  const hits = search(q, 5)
  const snippets = hits.filter(h=> h.score>0.01).map(h=> `PATH:${h.doc.meta?.path}\n`+h.doc.text.slice(0,4000)).join('\n---\n')
  const prompt = `Odgovori kratko i činjenično (HR). Ako nema u prilogu, reci da dokumenti ne sadrže odgovor.\nPitanje: ${q}\nPrilozi:\n${snippets}`
  const out = await ai.summarize(prompt, {} as any)
  const body={ ok:true, answer: out, hits: hits.map(h=> ({ id:h.doc.id, score: Math.round(h.score*1000)/1000, path:h.doc.meta?.path })) }
  const etag=crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex')
  setCache(key,{ etag, body, ts: now }); res.setHeader('ETag', etag); res.json(body)
})

export default r
