
import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth'
import { requireRole } from '../middleware/rbac'
import { spawnSync } from 'child_process'
import path from 'path'

const router = Router()
router.use(adminAuth('admin'), requireRole('admin'))

router.post('/admin/ops/log-retention', (_req, res) => {
  try{
    const script = path.join(process.cwd(),'backend','scripts','log_retention.py')
    const out = spawnSync('python', [script], { encoding: 'utf-8' })
    res.json({ ok: out.status===0, code: out.status, stdout: out.stdout, stderr: out.stderr })
  }catch(e:any){
    res.status(500).json({ error:'exec_error', message:String(e?.message||e) })
  }
})

router.post('/admin/ops/csp-analyze', (_req, res) => {
  try{
    const script = path.join(process.cwd(),'backend','scripts','csp_analyze.py')
    const out = spawnSync('python', [script], { encoding: 'utf-8' })
    res.json({ ok: out.status===0, code: out.status, stdout: out.stdout, stderr: out.stderr })
  }catch(e:any){
    res.status(500).json({ error:'exec_error', message:String(e?.message||e) })
  }
})

export default router
