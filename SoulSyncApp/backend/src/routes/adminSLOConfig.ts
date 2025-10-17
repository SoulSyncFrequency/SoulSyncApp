import { Router } from 'express'
import { prisma } from '../db/prismaClient'

const router = Router()

router.get('/slo-config', async (_req,res)=>{
  try{
    if(!prisma) return res.json({ config: null })
    let cfg = await (prisma as unknown).sLOConfig.findUnique({ where: { id: 1 } })
    if(!cfg){
      cfg = await (prisma as unknown).sLOConfig.create({ data: { id:1 } })
    }
    res.json({ config: cfg })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

router.put('/slo-config', async (req,res)=>{
  try{
    const body = req.body || {}
    const data: unknown = {}
    if(typeof body.webhookFailAlertPct==='number') data.webhookFailAlertPct = body.webhookFailAlertPct
    if(typeof body.emailFailAlertPct==='number') data.emailFailAlertPct = body.emailFailAlertPct
    if(typeof body.alertWebhookUrl==='string') data.alertWebhookUrl = body.alertWebhookUrl || null
    const cfg = await (prisma as unknown).sLOConfig.upsert({ where:{ id:1 }, create:{ id:1, ...data }, update:data })
    res.json({ ok:true, config: cfg })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

export default router
