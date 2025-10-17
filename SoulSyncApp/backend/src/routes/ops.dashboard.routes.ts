
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'
import path from 'path'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.get('/admin/ops-dashboard', (_req, res) => {
  
  const fs = require('fs'); const path = require('path'); const crypto = require('crypto')
  const nonce = crypto.randomBytes(16).toString('base64')
  const p = path.join(process.cwd(),'public','admin_ops.html')
  let html = fs.readFileSync(p,'utf-8')
  html = html.replace(/__CSP_NONCE__/g, nonce)
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`)
  res.send(html)
                    
})

export default router
