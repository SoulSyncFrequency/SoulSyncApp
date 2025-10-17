
import { Router } from 'express'
import { prisma } from '../db/prismaClient'
import { sendSingleWebhook } from '../services/webhookService'

const router = Router()

router.get('/webhooks', async (_req,res)=>{
  if(!prisma) return res.json({ items: [] })
  const items = await (prisma as unknown).webhookEndpoint.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ items })
})

router.post('/webhooks', async (req,res)=>{
  const { url, secret, active=true } = req.body||{}
  if(!url || !secret) return res.status(400).json({ error:'url & secret required' })
  if(!prisma) return res.status(501).json({ error:'DB not available' })
  const w = await (prisma as unknown).webhookEndpoint.create({ data: { url, secret, active } })
  res.json({ ok:true, id: w.id })
})

router.delete('/webhooks/:id', async (req,res)=>{
  if(!prisma) return res.status(501).json({ error:'DB not available' })
  const id = Number(req.params.id)
  await (prisma as unknown).webhookEndpoint.delete({ where: { id } })
  res.json({ ok:true })
})

router.post('/webhooks/:id/toggle', async (req,res)=>{
  if(!prisma) return res.status(501).json({ error:'DB not available' })
  const id = Number(req.params.id)
  const w = await (prisma as unknown).webhookEndpoint.findUnique({ where: { id } })
  if(!w) return res.status(404).json({ error:'Not found' })
  await (prisma as unknown).webhookEndpoint.update({ where: { id }, data: { active: !w.active } })
  res.json({ ok:true })
})

router.post('/webhooks/:id/test', async (req,res)=>{
  if(!prisma) return res.status(501).json({ error:'DB not available' })
  const id = Number(req.params.id)
  const w = await (prisma as unknown).webhookEndpoint.findUnique({ where: { id } })
  if(!w) return res.status(404).json({ error:'Not found' })
  await sendSingleWebhook(w, { type:'TEST', message:'Webhook test from SoulSync', meta:{}, createdAt: new Date().toISOString() })
  res.json({ ok:true })
})

// Logs
router.get('/webhooks/logs', async (req,res)=>{
  if(!prisma) return res.json({ items: [] })
  const status = String(req.query.status||'').trim()
  const search = String(req.query.search||'').trim()
  const days = Number(req.query.days||30)
  const where: unknown = {}
  if(status) where.status = status
  if(search) where.url = { contains: search, mode:'insensitive' }
  if(days>0) where.sentAt = { gte: new Date(Date.now() - days*24*60*60*1000) }
  const items = await (prisma as unknown).webhookLog.findMany({ where, orderBy: { sentAt: 'desc' }, take: 500 })
  res.json({ items })
})

router.post('/webhooks/logs/:id/retry', async (req,res)=>{
  if(!prisma) return res.status(501).json({ error:'DB not available' })
  const id = Number(req.params.id)
  const log = await (prisma as unknown).webhookLog.findUnique({ where: { id } })
  if(!log) return res.status(404).json({ error:'Not found' })
  const w = log.webhookId ? await (prisma as unknown).webhookEndpoint.findUnique({ where: { id: log.webhookId } }) : null
  const target = w || { id:null, url: log.url, secret: process.env.DEFAULT_WEBHOOK_SECRET||'default', active:true }
  await sendSingleWebhook(target, log.payload)
  res.json({ ok:true })
})

export default router
