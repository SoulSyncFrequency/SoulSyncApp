import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

export async function issueRefreshToken(userId: string, role: string, ttlDays=30){
  const jti = randomUUID()
  const expiresAt = new Date(Date.now() + ttlDays*24*60*60*1000)
  await prisma.refreshToken.create({ data: { userId, jti, expiresAt } })
  return { jti, expiresAt }
}

export async function revokeRefreshToken(jti: string){
  await prisma.refreshToken.update({ where: { jti }, data: { revoked: true } }).catch(()=>{})
}

export async function isRefreshValid(jti: string){
  const t = await prisma.refreshToken.findUnique({ where: { jti } })
  if (!t) return false
  if (t.revoked) return false
  if (t.expiresAt < new Date()) return false
  return true
}
