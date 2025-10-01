import type { Request, Response, NextFunction } from 'express'
import { prisma as prismaMaybe } from '../db/prismaClient'
const prisma:any = prismaMaybe

export async function corsTenant(req:Request,res:Response,next:NextFunction){
  try{
    const tenantId = (req as any).tenant?.id || 'default'
    let origins:string[] = []
    if(prisma && prisma.policy){
      const rec = await prisma.policy.findFirst({ where:{ tenantId } })
      origins = rec?.value?.cors?.origins || []
    }
    const origin = req.headers.origin as string|undefined
    if(origin && origins.includes(origin)){
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      if(req.method==='OPTIONS') return res.status(204).end()
    }
  }catch{}
  next()
}
