
import { Router } from 'express'
import { lintPlan, lintPlanEnhanced } from '../lib/supplementSafety'

const router = Router()
router.post('/ops/safety-lint', (req, res) => {
  if ((process.env.SUPPL_SAFETY_LINT_ENABLED||'true').toLowerCase()!=='true'){
    return res.status(503).json({ error:'safety_lint_disabled' })
  }
  try{
    const plan = req.body || {}
    const warnings = ('weightKg' in plan)? lintPlanEnhanced(plan as any): lintPlan(plan as any)
    res.json({ ok:true, warnings, disclaimer:'Informational only. Not medical advice.' })
  }catch(e:any){
    res.status(400).json({ error:'invalid_request', message:String(e?.message||e) })
  }
})
export default router
