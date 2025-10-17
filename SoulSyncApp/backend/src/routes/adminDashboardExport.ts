
import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { idempotency } from '../middleware/idempotency'
import { createBackpressure } from '../middleware/backpressure'
import { apiKeyRateLimit } from '../middleware/apiKeyRateLimit' } from '../middleware/backpressure'
import { prisma } from '../db/prismaClient'

const router = Router()
const backpressure = createBackpressure(Number(process.env.POLICY_MAX_CONCURRENCY||'4'))

router.get('/dashboard/export-pdf', async (_req,res)=>{
  try{
    const data = await fetchDashboardData()
    try{
      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages:true })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="dashboard_report.pdf"')
      doc.pipe(res)
      doc.fontSize(18).text('SoulSync — Dashboard Report', { align:'left' })
      doc.moveDown(0.5)
      doc.fontSize(10).text(new Date().toLocaleString())
      doc.moveDown(1)

      doc.fontSize(14).text('Counters')
      doc.fontSize(11).list([
        `Users: ${data.users}`,
        `Modules — active/disabled: ${data.modules.active}/${data.modules.disabled}`,
        `Notifications today: ${data.notifications.today}`,
        `Critical (7d)/Total (7d): ${data.notifications.critical7d}/${data.notifications.total7d}`,
      ])
      doc.moveDown(1)

      doc.fontSize(14).text('Top types (7d)')
      data.topTypes.forEach((t: unknown)=> doc.fontSize(11).text(`• ${t.type}: ${t.count}`))
      doc.moveDown(0.5)

      doc.fontSize(14).text('Top users (7d)')
      data.topUsers.forEach((u: unknown)=> doc.fontSize(11).text(`• ${u.email}: ${u.count}`))
      doc.moveDown(1)

      doc.fontSize(14).text('Watchdog status')
      for(const m of data.watchdog){
        doc.fontSize(11).text(`• ${m.name||('Module '+m.id)} — active:${m.active?'yes':'no'}, fails:${m.consecutiveFails}, lastPing:${m.lastPingAt? new Date(m.lastPingAt).toLocaleString() : '—'}`)
      }

      
      // Page numbers
      const range = doc.bufferedPageRange()
      for(let i=0;i<range.count;i++){
        doc.switchToPage(range.start + i)
        doc.fontSize(8).fillColor('#888').text(`Page ${i+1} of ${range.count}`, 0, 812, { width: 523, align: 'center' })
      }
      doc.end()

    }catch(e: unknown){
      // Fallback: no pdfkit installed
      res.status(501).json({ error: 'PDF export requires pdfkit. Please install: npm i pdfkit', details: e?.message })
    }
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'export failed' })
  }
})

async function fetchDashboardData(){
  const users = await (prisma as unknown).user.count()
  let active=0, disabled=0
  try{ const mods = await (prisma as unknown).therapyModule.findMany({ select:{ active:true } }); active = mods.filter((m: unknown)=>m.active).length; disabled = mods.length - active }catch{}
  const startToday = new Date(); startToday.setHours(0,0,0,0)
  const since7 = new Date(Date.now()-7*24*60*60*1000)
  const [today, total7] = await Promise.all([
    (prisma as unknown).notification.count({ where: { createdAt: { gte: startToday } } }),
    (prisma as unknown).notification.count({ where: { createdAt: { gte: since7 } } })
  ])
  const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']
  const critical7 = await (prisma as unknown).notification.count({ where: { createdAt: { gte: since7 }, type: { in: criticalTypes } } })
  // watchdog
  let watchdog: unknown[] = []
  try{
    const modules = await (prisma as unknown).therapyModule.findMany({ select:{ id:true, name:true, active:true } })
    const health = await (prisma as unknown).moduleHealth.findMany({ select:{ moduleId:true, lastPingAt:true, consecutiveFails:true } })
    const map: unknown = {}; for(const h of health) map[h.moduleId]=h
    watchdog = modules.map((m: unknown)=> ({ id:m.id, name:m.name, active:m.active, lastPingAt: map[m.id]?.lastPingAt || null, consecutiveFails: map[m.id]?.consecutiveFails || 0 }))
  }catch{}
  // top lists
  const recent = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since7 } }, select:{ type:true }, take: 5000 })
  const byType: Record<string, number> = {}
  for(const r of recent){ byType[r.type]=(byType[r.type]||0)+1 }
  const topTypes = Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([type,count])=>({type, count}))
  const withUsers = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since7 }, userId: { not: null } }, select:{ userId:true }, take: 5000 })
  const byUser: Record<number, number> = {}; for(const r of withUsers){ byUser[r.userId]=(byUser[r.userId]||0)+1 }
  const ids = Object.entries(byUser).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,_])=>Number(id))
  let topUsers: unknown[] = []; if(ids.length){ const rows = await (prisma as unknown).user.findMany({ where: { id: { in: ids } }, select:{ id:true, email:true } }); topUsers = rows.map((u: unknown)=>({ id:u.id, email:u.email, count: byUser[u.id] })) }
  return { users, modules:{active,disabled}, notifications:{ today, critical7d:critical7, total7d: total7 }, topTypes, topUsers, watchdog }
}

export default router
