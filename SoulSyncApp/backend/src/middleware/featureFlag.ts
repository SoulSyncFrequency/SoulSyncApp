import type { Request, Response, NextFunction } from 'express'
import { prisma as prismaMaybe } from '../db/prismaClient'

async function fetchFlags(tenantId:string){
  const prisma:any = prismaMaybe
  try{
    if(prisma && prisma.policy){
      const rec = await prisma.policy.findFirst({ where:{ tenantId } })
      return (rec?.value?.flags)||{}
    }
  }catch{}
  return {}
}

export function requireFlag(flagName:string){
  return async (req:Request,res:Response,next:NextFunction)=>{
    const tenantId = (req as any).tenant?.id || 'default'
    const flags = await fetchFlags(tenantId)
    if(flags[flagName]) return next()
    return res.status(404).json({ error:{ code:'feature_disabled', flag: flagName } })
  }
}
