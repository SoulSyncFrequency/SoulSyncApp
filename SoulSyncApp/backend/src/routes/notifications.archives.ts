import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
const DIR = path.join(process.cwd(), 'archives', 'notifications')
if(!fs.existsSync(path.join(process.cwd(),'archives'))) fs.mkdirSync(path.join(process.cwd(),'archives'))
if(!fs.existsSync(DIR)) fs.mkdirSync(DIR)

router.get('/archives', (req,res)=>{
  const files = fs.readdirSync(DIR).filter(f=>f.endsWith('.csv')).map(f=>{
    const fp = path.join(DIR, f)
    const st = fs.statSync(fp)
    return { filename: f, size: st.size, createdAt: st.mtime }
  }).sort((a,b)=> b.createdAt.getTime()-a.createdAt.getTime())
  res.json({ files })
})

router.get('/archives/:file', (req,res)=>{
  const f = req.params.file
  const fp = path.join(DIR, f)
  if(!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' })
  res.setHeader('Content-Disposition', 'attachment; filename=' + f)
  res.sendFile(fp)
})

export default router