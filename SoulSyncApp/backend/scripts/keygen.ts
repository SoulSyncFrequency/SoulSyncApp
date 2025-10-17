import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

/**
 * Usage:
 *  ts-node scripts/keygen.ts "My Key Name" admin
 *  (role optional; defaults to admin)
 * 
 * Prints RAW_KEY and HASH. If DB reachable, inserts ApiKey row.
 */
async function main(){
  const name = process.argv[2] || 'default-key'
  const role = (process.argv[3] || 'admin')
  const raw = crypto.randomBytes(48).toString('hex') // 96 hex chars (~384 bits)
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')

  console.log('RAW_KEY=', raw)
  console.log('KEY_HASH=', keyHash)
  console.log('NAME=', name, 'ROLE=', role)

  try {
    const prisma = new PrismaClient()
    const row = await prisma.apiKey.create({ data: { name, role, keyHash } })
    console.log('Inserted ApiKey id=', row.id)
  } catch (e){
    console.warn('Could not insert into DB (maybe env not configured). Save the hash manually.', e?.message || e)
  }
}

main()
