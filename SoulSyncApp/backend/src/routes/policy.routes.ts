import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { prisma as prismaMaybe } from '../db/prismaClient'
import { requireMfa } from '../middleware/requireMfa'
import fs from 'fs'; import path from 'path'

const prisma:any = prismaMaybe
const r = Router()
function isAdmin(req:any){ return req?.user?.roles?.includes('admin') }
const FALLBACK_LOG = path.join(process.cwd(), 'policy-history.log')

r.get('/admin/policy', requireMfa, async (req:any,res)=>{
  if(!isAdmin(req)) return res.status(403).json({ error:{ code:'forbidden' } })
  const tenantId = req.tenant?.id || 'default'
  const rec = await prisma.policy.findFirst({ where:{ tenantId } })
  res.json({ ok:true, policy: rec?.value||{} })
})

r.put('/admin/policy', requireMfa, async (req:any,res)=>{
  if(!isAdmin(req)) return res.status(403).json({ error:{ code:'forbidden' } })
  const tenantId = req.tenant?.id || 'default'
  const value = req.body||{}
  const prev = await prisma.policy.findFirst({ where:{ tenantId } })
  const actor = req.user?.id || 'unknown'
  const at = new Date().toISOString()
  try{
    if(prev){
      await prisma.policy.update({ where:{ id: prev.id }, data:{ value } })
    }else{
      await prisma.policy.create({ data:{ tenantId, value } })
    }
    // try history table, else file log
    try{
      if(prisma.policyHistory) await prisma.policyHistory.create({ data:{ tenantId, actorId: actor, before: prev?.value||{}, after: value, at } })
      else throw new Error('no table')
    }catch{
      const line = JSON.stringify({ tenantId, actorId: actor, at, before: prev?.value||{}, after: value })
      fs.appendFileSync(FALLBACK_LOG, line + '\n')
    }
    res.json({ ok:true })
  }catch(e:any){
    res.status(500).json({ error:{ code:'policy_update_failed', message: e?.message||String(e) } })
  }
})

r.get('/admin/policy/history', requireMfa, async (req:any,res)=>{
  if(!isAdmin(req)) return res.status(403).json({ error:{ code:'forbidden' } })
  const tenantId = req.tenant?.id || 'default'
  try{
    if(prisma.policyHistory){
      const rows = await prisma.policyHistory.findMany({ where:{ tenantId }, orderBy:{ at: 'desc' }, take: 100 })
      return res.json({ ok:true, history: rows })
    }
  }catch{}
  // fallback: read file
  try{
    const lines = fs.existsSync(FALLBACK_LOG) ? fs.readFileSync(FALLBACK_LOG,'utf8').trim().split(/\n+/).reverse().slice(0,100) : []
    const rows = lines.map(l=> JSON.parse(l)).filter(x=> x.tenantId===tenantId)
    return res.json({ ok:true, history: rows })
  }catch(e:any){
    return res.json({ ok:true, history: [] })
  }
})

r.post('/admin/policy/rollback', requireMfa, async (req:any,res)=>{
  if(!isAdmin(req)) return res.status(403).json({ error:{ code:'forbidden' } })
  const tenantId = req.tenant?.id || 'default'
  const { at } = req.body||{}
  if(!at) return res.status(400).json({ error:{ code:'bad_request' } })
  // Prefer DB
  try{
    if(prisma.policyHistory){
      const row = await prisma.policyHistory.findFirst({ where:{ tenantId, at } })
      if(!row) return res.status(404).json({ error:{ code:'not_found' } })
      await prisma.policy.updateMany({ where:{ tenantId }, data:{ value: row.before } })
      return res.json({ ok:true })
    }
  }catch{}
  // file fallback (replace with last matching record)
  try{
    const lines = fs.existsSync(FALLBACK_LOG) ? fs.readFileSync(FALLBACK_LOG,'utf8').trim().split(/\n+/) : []
    const row = lines.map(l=> JSON.parse(l)).find(x=> x.tenantId===tenantId && x.at===at)
    if(!row) return res.status(404).json({ error:{ code:'not_found' } })
    // here we cannot write back to structured store; return desired state so UI can PUT
    return res.json({ ok:true, restore: row.before })
  }catch(e:any){
    return res.status(500).json({ error:{ code:'rollback_failed', message: e?.message||String(e) } })
  }
})

export default r
