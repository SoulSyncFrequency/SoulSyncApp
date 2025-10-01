
import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { prisma } from '../db/prismaClient'

const router = Router()

router.get('/dashboard', async (_req,res)=>{
  try{
    if(!prisma) return res.json({ users:0, modules:{active:0, disabled:0}, notifications:{today:0, critical7d:0, total7d:0}, topTypes:[], topUsers:[] })
    // users count
    const users = await (prisma as unknown).user.count()

    // modules status (fallback if table doesn't exist gracefully)
    let active=0, disabled=0
    try{
      const mods = await (prisma as unknown).therapyModule.findMany({ select:{ active:true } })
      active = mods.filter((m: unknown)=>m.active).length
      disabled = mods.length - active
    }catch{}

    // notifications today + last 7 days (critical and total)
    const startToday = new Date(); startToday.setHours(0,0,0,0)
    const since7 = new Date(Date.now()-7*24*60*60*1000)
    const [today, total7] = await Promise.all([
      (prisma as unknown).notification.count({ where: { createdAt: { gte: startToday } } }),
      (prisma as unknown).notification.count({ where: { createdAt: { gte: since7 } } })
    ])
    const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']
    const critical7 = await (prisma as unknown).notification.count({ where: { createdAt: { gte: since7 }, type: { in: criticalTypes } } })

    // top types (last 7d)
    const recent = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since7 } }, select:{ type:true }, take: 5000 })
    const byType: Record<string, number> = {}
    for(const r of recent){ byType[r.type] = (byType[r.type]||0)+1 }
    const topTypes = Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([type,count])=>({type, count}))

    // top users by activity (if Notification.userId exists)
    const withUsers = await (prisma as unknown).notification.findMany({ where: { createdAt: { gte: since7 }, userId: { not: null } }, select:{ userId:true }, take: 5000 })
    const byUser: Record<number, number> = {}
    for(const r of withUsers){ byUser[r.userId] = (byUser[r.userId]||0)+1 }
    const topUsersIds = Object.entries(byUser).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,_])=>Number(id))
    let topUsers: unknown[] = []
    if(topUsersIds.length){
      const rows = await (prisma as unknown).user.findMany({ where: { id: { in: topUsersIds } }, select:{ id:true, email:true } })
      topUsers = rows.map((u: unknown)=>({ id:u.id, email:u.email, count: byUser[u.id] }))
      topUsers.sort((a: unknown,b: unknown)=>b.count-a.count)
    }

    res.json({
      users,
      modules: { active, disabled },
      notifications: { today, critical7d: critical7, total7d: total7 },
      topTypes,
      topUsers,
      deltas: {
        users: await deltaUsers(),
        modulesActive: await deltaModulesActive(),
        notifsToday: await deltaNotifsToday(),
        critical7d: await deltaCritical7d()
      }
    })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'dashboard failed' })
  }
})


async function deltaUsers(){
  try{
    const now = await (prisma as unknown).user.count()
    const since7 = new Date(Date.now()-7*24*60*60*1000)
    const prev = await (prisma as unknown).user.count({ where: { createdAt: { lte: since7 } } })
    return pct(prev, now)
  }catch{ return 0 }
}
async function deltaModulesActive(){
  try{
    const mods = await (prisma as unknown).therapyModule.findMany({ select:{ active:true } })
    const now = mods.filter((m: unknown)=>m.active).length
    // naive prev: assume same (unless you keep history). Return 0 to avoid noise.
    return 0
  }catch{ return 0 }
}
async function deltaNotifsToday(){
  try{
    const startToday = new Date(); startToday.setHours(0,0,0,0)
    const lastWeekSameDay = new Date(startToday.getTime() - 7*24*60*60*1000)
    const endLastWeekSameDay = new Date(lastWeekSameDay.getTime() + 24*60*60*1000)
    const now = await (prisma as unknown).notification.count({ where: { createdAt: { gte: startToday } } })
    const prev = await (prisma as unknown).notification.count({ where: { createdAt: { gte: lastWeekSameDay, lt: endLastWeekSameDay } } })
    return pct(prev, now)
  }catch{ return 0 }
}
async function deltaCritical7d(){
  try{
    const criticalTypes = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']
    const since7 = new Date(Date.now()-7*24*60*60*1000)
    const prevSince = new Date(Date.now()-14*24*60*60*1000)
    const now = await (prisma as unknown).notification.count({ where: { createdAt: { gte: since7 }, type: { in: criticalTypes } } })
    const prev = await (prisma as unknown).notification.count({ where: { createdAt: { gte: prevSince, lt: since7 }, type: { in: criticalTypes } } })
    return pct(prev, now)
  }catch{ return 0 }
}
function pct(prev:number, now:number){
  if(!prev && !now) return 0
  if(!prev) return 100
  return Math.round(((now - prev) / prev) * 100)
}


export default router
