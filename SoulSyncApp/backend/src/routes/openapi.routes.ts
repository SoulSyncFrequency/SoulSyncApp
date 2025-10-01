
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/openapi.json', (_req, res) => {
  try{
    const p = path.join(process.cwd(), 'backend', 'openapi', 'openapi.json')
    if (!fs.existsSync(p)) return res.status(404).json({ error:'not_found' })
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(fs.readFileSync(p, 'utf-8'))
  }catch{
    res.status(500).json({ error:'openapi_unavailable' })
  }
})

export default router
