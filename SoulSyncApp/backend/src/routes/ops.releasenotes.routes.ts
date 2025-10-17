
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/ops/release-notes', (req, res) => {
  try{
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(),'backend','package.json'),'utf-8'))
    const spec = JSON.parse(fs.readFileSync(path.join(process.cwd(),'backend','openapi','openapi.json'),'utf-8'))
    const methods = ['get','post','put','patch','delete']
    const total = { paths: 0, ops: 0 }
    const perMethod:any = {}
    const list:string[] = []
    for (const p of Object.keys(spec.paths||{})){
      total.paths++
      const ops = spec.paths[p]||{}
      for (const m of methods){
        if (ops[m]){ total.ops++; perMethod[m]=(perMethod[m]||0)+1; list.push(`${m.toUpperCase()} ${p}`) }
      }
    }
    
    const raw = JSON.stringify({ 
      ok:true,
      version: pkg.version || 'unknown',
      summary: { paths: total.paths, operations: total.ops, perMethod },
      highlights: list.slice(0, 20)
    })
    const crypto = require('crypto')
    const etag = 'W/"'+ crypto.createHash('sha1').update(Buffer.from(raw)).digest('hex') +'"'
    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control','public, max-age=300, must-revalidate')
    if (req.headers['if-none-match'] === etag){ res.status(304).end(); return }
    res.setHeader('Content-Type','application/json; charset=utf-8')
    res.end(raw)
    
      ok:true,
      version: pkg.version || 'unknown',
      summary: { paths: total.paths, operations: total.ops, perMethod },
      highlights: list.slice(0, 20) // preview first 20
    })
  }catch(e:any){
    res.status(500).json({ error:'release_notes_error', message:String(e?.message||e) })
  }
})
export default router
