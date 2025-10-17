import type { Request, Response, NextFunction } from 'express'
import { prisma as prismaMaybe } from '../db/prismaClient'

async function getPolicy(){
  const prisma:any = prismaMaybe
  if(prisma && prisma.policy){ const rec = await prisma.policy.findFirst(); return rec?.value || {} }
  return {}
}

/** Requires either 'pro' entitlement or admin role for paid features */
export async function requireEntitlement(req:Request, res:Response, next:NextFunction){
  try{
    const user:any = (req as any).user || {}
    if(user?.roles?.includes('admin')) return next()
    const policy = await getPolicy()
    const ents = policy?.entitlements || {}
    const uid = user?.id
    if(uid && ents[uid]?.includes('pro')) return next()
    return res.status(402).json({ ok:false, code:'payment_required' })
  }catch{ return res.status(500).json({ ok:false }) }
}
