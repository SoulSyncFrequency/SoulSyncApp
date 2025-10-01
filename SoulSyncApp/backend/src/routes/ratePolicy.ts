import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
const router = Router()

function propose(base:any){
  // naive heuristics (can be expanded): lower limits for routes with many 429; increase where no 429 and low latency
  const cfg:any = { ...base }
  for(const r of Object.keys(cfg)){
    const c = base[r]
    if(c.rejections && c.rejections > 10){ cfg[r] = { points: Math.max(3, Math.floor(c.points*0.7)), duration: c.duration } }
    else if(c.count && c.count > 100 && c.p95 && c.p95 < 100){ cfg[r] = { points: Math.floor(c.points*1.2), duration: c.duration } }
  }
  return cfg
}

router.post('/admin/rate-policy/propose', async (req, res)=>{
  const stats = req.body?.stats || {}
  const base = req.body?.base || {
    '/api/f0score': { points: 30, duration: 60 },
    '/api/admin/datasheet/pdf': { points: 6, duration: 60 },
    '/api/admin/suggestions/apply': { points: 10, duration: 60 }
  }
  const proposal = propose(stats && Object.keys(stats).length ? stats : base)
  let ai:any = null
  try{
    if(process.env.RATE_POLICY_AI==='1' && process.env.OPENAI_API_KEY){
      const text = `Given the following route statistics and a proposed rate policy, provide 3 concise bullet notes explaining rationale and risks. Stats: ${JSON.stringify(stats).slice(0,4000)} Proposal: ${JSON.stringify(proposal)}`
      const { fetchWithTimeout } = require('../utils/http');
      const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages:[{ role:'user', content:text }], temperature:0.2 })
      })
      const data:any = await resp.json()
      ai = data?.choices?.[0]?.message?.content || null
    }
  }catch{}
  return res.json({ ok:true, proposal, ai })
})

export default router
