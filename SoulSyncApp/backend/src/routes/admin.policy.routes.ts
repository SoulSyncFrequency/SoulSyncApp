import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { gateFeature } from '../config/flags'
import { withEtag } from '../utils/etag'
import { prisma as prismaMaybe } from '../db/prismaClient'

const r = Router()
const mem:any = { flags: { FEATURE_aiApi: true, FEATURE_gdprApi: true, FEATURE_aiGuard: true }, entitlements: {} }

async function loadPolicy(){
  const prisma:any = prismaMaybe
  if(prisma && prisma.policy){ 
    const rec = await prisma.policy.findFirst()
    if(rec) return rec.value
  }
  return mem
}

async function savePolicy(value:any){
  const prisma:any = prismaMaybe
  if(prisma && prisma.policy){
    const rec = await prisma.policy.findFirst()
    if(rec) await prisma.policy.update({ where:{ id: rec.id }, data:{ value } })
    else await prisma.policy.create({ data:{ value } })
  } else {
    mem.flags = value.flags||mem.flags
    mem.entitlements = value.entitlements||mem.entitlements
  }
}

r.get('/admin/policy', gateFeature('admin'), requireAuth, async (_req,res)=>{
  const value = await loadPolicy()
  if(!withEtag(res, { ok:true, policy: value })) {}
})

r.post('/admin/policy', gateFeature('admin'), requireAuth, async (req,res)=>{
  const { flags, entitlements } = req.body || {}
  const current = await loadPolicy()
  const next = { flags: { ...(current.flags||{}), ...(flags||{}) }, entitlements: { ...(current.entitlements||{}), ...(entitlements||{}) } }
  await savePolicy(next)
  res.json({ ok:true, policy: next })
})

export default r
