import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { requireRole } from '../middleware/apiKeyAuth'

const router = Router()

router.post('/admin/ops/summary', requireRole('viewer'), async (req, res)=>{
  if(process.env.OPS_AI_SUMMARY !== '1') return res.status(404).json({ ok:false, error:'ai_disabled' })
  if(!process.env.OPENAI_API_KEY) return res.status(400).json({ ok:false, error:'no_openai_key' })
  try{
    const ctx = {
      info: req.body?.info || {},
      stats: req.body?.stats || {},
      notes: req.body?.notes || ''
    }
    const { fetchWithTimeout } = require('../utils/http')
    const prompt = `Sažmi operativno stanje servisa u 5 kratkih bullet točaka (hrvatski). Fokus: performanse (p95), 5xx trend, 429 (RL), i preporuke. Kontekst: ${JSON.stringify(ctx).slice(0,6000)}`
    const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Authorization': 'Bearer '+process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages:[{ role:'user', content: prompt }], temperature: 0.2 })
    }, 15000)
    const data = await resp.json()
    const summary = data?.choices?.[0]?.message?.content || ''
    res.json({ ok:true, summary })
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router
