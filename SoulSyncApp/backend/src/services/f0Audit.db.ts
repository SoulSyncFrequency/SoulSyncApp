
import { prisma as prismaMaybe } from '../db/prismaClient'

export async function recordF0AuditDB(rec: { inputHash:string, profile:string, params:any, score:number, safeGate:number }){
  try{
    const prisma:any = prismaMaybe
    if(!prisma || !prisma.f0Audit) return
    await prisma.f0Audit.create({ data: rec })
  }catch{ /* ignore */ }
}
