import { Router } from 'express'
import { prisma as prismaMaybe } from '../db/prismaClient'
import { requireMfa } from '../middleware/requireMfa'
const prisma:any = prismaMaybe
const r = Router()

function isAdmin(req:any){ return req?.user?.roles?.includes('admin') }

r.get('/admin/tenants', requireMfa, async (req:any,res)=>{
  if(!isAdmin(req)) return res.status(403).json({ error:{ code:'forbidden' } })
  const rows = await prisma.policy.findMany({ select:{ tenantId:true, value:true, id:true }, take: 500 })
  res.json({ ok:true, tenants: rows })
})

export default r
