
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.post('/csp-report', (req:any, res:any) => {
  // Accept both application/csp-report and application/json
  const body = (req.body && (req.body['csp-report'] || req.body)) || {}
  try{
    const dir = path.join(process.cwd(), 'logs')
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir,'csp.ndjson'), JSON.stringify({ t: Date.now(), report: body }) + "\n", 'utf-8')
  }catch{}
  res.status(204).end()
})

export default router
