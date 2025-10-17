import { Router } from 'express'
import fs from 'fs'
import path from 'path'
const router = Router()
router.get('/version', (_req, res)=>{
  try{
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'),'utf-8'))
    res.json({ ok:true, name: pkg.name, version: pkg.version, ts: Date.now() })
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message })
  }
})
export default router
