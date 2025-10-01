import { prisma } from '../db/prismaClient'
export async function createConsentVersion(text:string){
  const crypto=require('crypto'); const hash=crypto.createHash('sha256').update(text).digest('hex')
  return (prisma as any).consentVersion.create({ data:{ text, hash } })
}
export async function listConsentVersions(){ return (prisma as any).consentVersion.findMany() }
