
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
const router = Router()
router.get('/version', (_req, res) => {
  try{
    const p = path.join(process.cwd(), 'backend', 'package.json')
    const j = JSON.parse(fs.readFileSync(p,'utf-8'))
    res.json({ name: j.name, version: j.version })
  }catch{
    res.json({ name: 'backend', version: 'unknown' })
  }
})
export default router
