import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { prisma } from '../db/prismaClient'
import { addNotification } from '../services/notifyService'

const router = Router()

// List notifications (optionally filter unread)
router.get('/', async (req, res) => {
  try{
    if(!prisma) return res.json({ items: [], total: 0 })
    const unreadOnly = String(req.query.unread||'') === 'true'
    const where: unknown = unreadOnly ? { read: false } : {}
    const items = await (prisma as unknown).notification.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200
    })
    const total = await (prisma as unknown).notification.count({ where })
    res.json({ items, total })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'Failed to fetch notifications' })
  }
})

// Mark as read
router.post('/mark-read', async (req, res) => {
  try{
    const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids : []
    if(!prisma || ids.length===0) return res.json({ ok: true })
    await (prisma as unknown).notification.updateMany({
      where: { id: { in: ids } }, data: { read: true }
    })
    res.json({ ok: true })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'Failed to mark-read' })
  }
})

// Debug insert
router.post('/reset', async (req,res)=>{
  const { type='DEBUG', message='Test notification', userId=null, meta=null } = req.body||{}
  await addNotification({ type, message, userId, meta })
  res.json({ ok: true })
})

export default router

router.get('/stats', async (req,res)=>{
  try{
    if(!prisma) return res.json({ critical:0, normal:0 })
    const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']
    const crit = await (prisma as unknown).notification.count({ where: { type: { in: criticalTypes } } })
    const total = await (prisma as unknown).notification.count()
    res.json({ critical: crit, normal: Math.max(0,total-crit), total })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'stats failed' })
  }
})

router.get('/daily', async (req,res)=>{
  try{
    if(!prisma) return res.json({ points: [] })
    const days = Number(req.query.days||30)
    const since = new Date(Date.now() - days*24*60*60*1000)
    // simple approach: fetch and group in memory
    const rows = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'asc' }, select: { createdAt: true, type: true } })
    const map: Record<string,{date:string, total:number, critical:number}> = {}
    const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']
    for(const r of rows){
      const d = new Date(r.createdAt); const key = d.toISOString().slice(0,10)
      if(!map[key]) map[key] = { date:key, total:0, critical:0 }
      map[key].total++
      if(criticalTypes.includes(r.type)) map[key].critical++
    }
    const points = Object.values(map)
    res.json({ points })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'daily failed' })
  }
})

router.get('/paged', async (req,res)=>{
  try{
    if(!prisma) return res.json({ items: [], total: 0, page:1, pageSize:50 })
    const unreadOnly = String(req.query.unread||'') === 'true'
    const type = String(req.query.type||'').trim()
    const search = String(req.query.search||'').trim()
    const days = Number(req.query.days||0)
    const page = Math.max(1, Number(req.query.page||1))
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize||50)))
    const where: unknown = {}
    if(unreadOnly) where.read = false
    if(type) where.type = type
    if(search) where.message = { contains: search, mode: 'insensitive' }
    if(days>0){
      const since = new Date(Date.now() - days*24*60*60*1000)
      where.createdAt = { gte: since }
    }
    const total = await (prisma as unknown).notification.count({ where })
    const items = await (prisma as unknown).notification.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize
    })
    res.json({ items, total, page, pageSize })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'paged failed' })
  }
})
