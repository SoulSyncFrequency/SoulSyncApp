import { Router } from 'express'
const router = Router()

router.get('/admin/flags', (req, res)=>{
  const f = {
    redis: !!process.env.REDIS_URL,
    f0_redis: process.env.F0_REDIS_CACHE === '1',
    verify_suggestions: process.env.VERIFY_SUGGESTIONS === '1',
    ai_summary: !!process.env.OPENAI_API_KEY,
    ai_columns: process.env.DS_AI_COLUMNS === '1',
    prometheus: process.env.PROMETHEUS_ENABLED === '1',
    http_hist: process.env.PROM_METRICS_HTTP === '1',
    https: process.env.FORCE_HTTPS === '1',
    maintenance: process.env.MAINTENANCE_MODE === '1',
    admin_tools: process.env.ADMIN_TOOLS_ENABLED !== '0',
  }
  res.json({ ok:true, flags: f })
})

export default router
