
import { Router } from 'express'
import fs from 'fs'
import { clampPageLimit } from '../lib/pagination'
import path from 'path'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'

function readLines(p:string, skip:number, take:number){
  const data = fs.readFileSync(p,'utf-8').split('\n').filter(Boolean)
  const total = data.length
  const slice = data.slice(Math.max(0,total - (skip+take)), Math.max(0,total - skip))
  return { total, items: slice.map((l)=>{ try{return JSON.parse(l)}catch{return {raw:l}} }) }
}

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/admin/audit/admin-actions', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page||'1'))||1)
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit||'50'))||50))
  const skip = (page-1)*limit
  const p = path.join(process.cwd(),'logs','admin_audit.ndjson')
  if (!fs.existsSync(p)) return res.json({ page, limit, total: 0, items: [] })
  const { total, items } = readLines(p, skip, limit)
  res.json({ page, limit, total, items })
})

router.get('/admin/audit/csp', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page||'1'))||1)
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit||'50'))||50))
  const skip = (page-1)*limit
  const p = path.join(process.cwd(),'logs','csp.ndjson')
  if (!fs.existsSync(p)) return res.json({ page, limit, total: 0, items: [] })
  const { total, items } = readLines(p, skip, limit)
  res.json({ page, limit, total, items })
})

export default router
