
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
import { supplementDoseCounter } from '../metrics/supplementMetrics'
export async function createProgestEPlan(userId: string, params: any){
  return prisma.supplementPlan.create({ data: { userId, type:'PROGEST_E', params, status:'draft' } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
}
export async function acceptProgestEConsent(planId: string){
  return prisma.supplementPlan.update({ where: { id: planId }, data: { consentAt: new Date(), status:'active' } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
}
export async function logProgestEDose(userId: string, input: any){
  const created = await prisma.supplementDose.create({ data: { planId: input.planId, userId, ts: new Date(input.ts), amount: input.amount, unit: input.unit, route: input.route, note: input.note || null, symptoms: input.symptoms || null } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
}
export async function getProgestEDoses(userId: string, planId: string, range?: {from?: Date; to?: Date})
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created{
  return prisma.supplementDose.findMany({ where: { userId, planId, ...(range?.from||range?.to? { ts: { ...(range?.from? { gte: range.from }: {})
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created, ...(range?.to? { lte: range.to }: {})
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created } }: {})
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created }, orderBy: { ts:'desc' } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
}
export async function summarizeAdherenceAndSymptoms(userId:string, planId:string){
  
  const plan = await prisma.supplementPlan.findUnique({ where:{ id: planId }, select:{ params: true } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
  const mgPerDrop = plan?.params && typeof (plan as any).params.mgPerDrop === 'number' ? Number((plan as any).params.mgPerDrop) : null

  const doses = await prisma.supplementDose.findMany({ where: { userId, planId }, orderBy: { ts:'asc' } })
  try{ supplementDoseCounter.inc({ type: 'PROGEST_E' }) }catch{}
  return created
  if (!doses.length) return { doses:0, summary:'No doses logged yet.' }
  const stats:any = { count:doses.length, total:0, unit:doses[0].unit, mood:[], sleep:[], anxiety:[], cramps:[] }
  for (const d of doses){ stats.total += Number(d.amount); const s:any = d.symptoms||{}; if (typeof s.mood==='number') stats.mood.push(s.mood); if (typeof s.sleep==='number') stats.sleep.push(s.sleep); if (typeof s.anxiety==='number') stats.anxiety.push(s.anxiety); if (typeof s.cramps==='number') stats.cramps.push(s.cramps) }
  const avg = (a:number[])=> a.length? (a.reduce((x,y)=>x+y,0)/a.length): null
  const totalMg = (mgPerDrop && stats.unit==='drop') ? (stats.total * mgPerDrop) : null;
  return { doses: stats.count, totalAmount: stats.total, unit: stats.unit, totalAmountMg: totalMg, avgMood: avg(stats.mood), avgSleep: avg(stats.sleep), avgAnxiety: avg(stats.anxiety), avgCramps: avg(stats.cramps) }
}
