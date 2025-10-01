
import { Router } from 'express'
import { prisma } from '../db/prismaClient'
import { addNotification } from '../services/notifyService'

const router = Router()

router.get('/watchdog-status', async (_req,res)=>{
  try{
    if(!prisma) return res.json({ items: [] })
    // Fetch modules
    const modules = await (prisma as unknown).therapyModule.findMany({ select: { id:true, name:true, active:true } })
    // Try to join ModuleHealth if exists
    let healthByModule: Record<number, any> = {}
    try{
      const health = await (prisma as unknown).moduleHealth.findMany({ select: { moduleId:true, lastPingAt:true, consecutiveFails:true } })
      for(const h of health) healthByModule[h.moduleId] = h
    }catch{}
    const items = modules.map((m: unknown)=>{
      const h = healthByModule[m.id] || {}
      return {
        id: m.id, name: m.name, active: m.active,
        lastPingAt: h.lastPingAt || null,
        consecutiveFails: typeof h.consecutiveFails==='number'? h.consecutiveFails : 0
      }
    })
    res.json({ items })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

router.put('/modules/:id/reset-fails', async (req,res)=>{
  try{
    const id = Number(req.params.id)
    if(!prisma) return res.json({ ok:true })
    // reset in ModuleHealth if table exists
    try{
      await (prisma as unknown).moduleHealth.updateMany({ where: { moduleId: id }, data: { consecutiveFails: 0 } })
    }catch{}
    // Optionally ensure module is active again
    try{
      await (prisma as unknown).therapyModule.update({ where: { id }, data: { active: true } })
    }catch{}
    try{ await addNotification({ type:'MODULE_FAILCOUNT_RESET', message:`Module ${id} fail counter reset`, meta:{ url:'/admin/therapy-modules', id } }) }catch{}
    res.json({ ok:true })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'reset failed' })
  }
})

export default router
