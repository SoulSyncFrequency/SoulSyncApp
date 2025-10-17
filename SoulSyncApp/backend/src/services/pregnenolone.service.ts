
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
import { supplementDoseCounter } from '../metrics/supplementMetrics'

export async function createPregnenolonePlan(userId: string, params: any){
  return prisma.supplementPlan.create({ data: { userId, type:'PREGNENOLONE', params, status:'draft', name:'Pregnenolone Plan' } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
}
export async function acceptPregnenoloneConsent(planId: string){
  return prisma.supplementPlan.update({ where: { id: planId }, data: { consentAt: new Date(), status:'active' } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
}
export async function logPregnenoloneDose(userId: string, input: any){
  const created = await prisma.supplementDose.create({ data: { planId: input.planId, userId, ts: new Date(input.ts), amount: input.amount, unit: input.unit, route: input.route, note: input.note || null, symptoms: input.symptoms || null } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
}
export async function getPregnenoloneDoses(userId: string, planId: string, range?: {from?: Date; to?: Date})
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created{
  return prisma.supplementDose.findMany({ where: { userId, planId, ...(range?.from||range?.to? { ts: { ...(range?.from? { gte: range.from }: {})
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created, ...(range?.to? { lte: range.to }: {})
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created } }: {})
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created }, orderBy: { ts:'desc' } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
}
export async function summarizePregnenolone(userId:string, planId:string){
  
  const plan = await prisma.supplementPlan.findUnique({ where:{ id: planId }, select:{ params: true } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
  const mgPerDrop = plan?.params && typeof (plan as any).params.mgPerDrop === 'number' ? Number((plan as any).params.mgPerDrop) : null

  const doses = await prisma.supplementDose.findMany({ where: { userId, planId }, orderBy: { ts:'asc' } })
  try{ supplementDoseCounter.inc({ type: 'PREGNENOLONE' }) }catch{}
  return created
  if (!doses.length) return { doses:0, totalAmount:0, unit:null, avgMood:null, avgFocus:null, avgAnxiety:null, avgEnergy:null, avgSleep:null }
  const stats:any = { count:doses.length, total:0, unit:doses[0].unit, mood:[], focus:[], anxiety:[], energy:[], sleep:[] }
  for (const d of doses){
    stats.total += Number(d.amount)
    const s:any = d.symptoms || {}
    if (typeof s.mood==='number') stats.mood.push(s.mood)
    if (typeof s.focus==='number') stats.focus.push(s.focus)
    if (typeof s.anxiety==='number') stats.anxiety.push(s.anxiety)
    if (typeof s.energy==='number') stats.energy.push(s.energy)
    if (typeof s.sleep==='number') stats.sleep.push(s.sleep)
  }
  const avg = (a:number[])=> a.length? (a.reduce((x,y)=>x+y,0)/a.length): null
  const totalMg = (mgPerDrop && stats.unit==='drop') ? (stats.total * mgPerDrop) : (stats.unit==='mg'? stats.total: null);
  return { doses: stats.count, totalAmount: stats.total, unit: stats.unit, totalAmountMg: totalMg, avgMood: avg(stats.mood), avgFocus: avg(stats.focus), avgAnxiety: avg(stats.anxiety), avgEnergy: avg(stats.energy), avgSleep: avg(stats.sleep) }
}
