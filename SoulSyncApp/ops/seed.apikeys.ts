
// prisma seed: creates demo keys with different tiers
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashKey(k:string){ return crypto.createHash('sha256').update(k).digest('hex') }

async function main(){
  const seeds = [
    { name:'public-free', raw:'public',    tier:'FREE',       rpm:30,  dailyCap:1000,  scopes:[] },
    { name:'starter',     raw:'starter1',  tier:'STARTER',    rpm:60,  dailyCap:5000,  scopes:['basic'] },
    { name:'pro',         raw:'pro1',      tier:'PRO',        rpm:300, dailyCap:50000, scopes:['basic','reports:read'] },
    { name:'enterprise',  raw:'ent1',      tier:'ENTERPRISE', rpm:1200,dailyCap:500000,scopes:['*'] },
  ] as const
  for (const s of seeds){
    await prisma.apiKey.upsert({
      where: { name: s.name },
      update: { tier: s.tier as any, rpm: s.rpm, dailyCap: s.dailyCap, scopes: s.scopes },
      create: { name: s.name, keyHash: hashKey(s.raw), role:'admin', tier: s.tier as any, rpm:s.rpm, dailyCap:s.dailyCap, scopes:s.scopes }
    })
  }
  console.log('Seeded ApiKeys. Raw keys:', seeds.map(s=>`${s.name}=${s.raw}`).join(', '))
}

main().catch(e=>{ console.error(e); process.exit(1)}).finally(()=>prisma.$disconnect())
