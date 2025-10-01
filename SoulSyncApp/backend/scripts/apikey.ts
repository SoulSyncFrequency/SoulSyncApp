/**
 * Admin CLI for API keys
 * Usage:
 *  npx ts-node scripts/apikey.ts list
 *  npx ts-node scripts/apikey.ts create "Integration Name" admin
 *  npx ts-node scripts/apikey.ts rotate <keyId>
 *  npx ts-node scripts/apikey.ts disable <keyId>
 *  npx ts-node scripts/apikey.ts enable <keyId>
 */
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listKeys(){
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  console.table(keys.map(k => ({ id: k.id, name: k.name, role: k.role, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt })))
}

async function createKey(name='default-key', role='admin'){
  const raw = crypto.randomBytes(48).toString('hex')
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')
  const row = await prisma.apiKey.create({ data: { name, role, keyHash } })
  console.log('Created API key:')
  console.log('  ID:', row.id)
  console.log('  NAME:', row.name)
  console.log('  ROLE:', row.role)
  console.log('  RAW_KEY (save this now!):', raw)
}

async function rotateKey(id: string){
  const raw = crypto.randomBytes(48).toString('hex')
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')
  await prisma.apiKey.update({ where: { id }, data: { keyHash } })
  console.log('Rotated key', id)
  console.log('  NEW RAW_KEY:', raw)
}

async function setEnabled(id: string, disabled: boolean){
  // If model lacks disabled flag, simulate disable by clearing hash (not recommended) – better approach is to add a disabled flag.
  // Add 'disabled' boolean to schema if not present.
  const modelHasDisabled = true // we will ensure schema change below
  if (!modelHasDisabled) {
    console.warn('Disabled flag not available in schema. Cannot disable/enable cleanly.')
    return
  }
  await prisma.apiKey.update({ where: { id }, data: { disabled } as any })
  console.log(disabled ? 'Disabled' : 'Enabled', 'key', id)
}

async function main(){
  const [cmd, a1, a2] = process.argv.slice(2)
  try {
    switch (cmd){
      case 'list': await listKeys(); break
      case 'create': await createKey(a1, a2 || 'admin'); break
      case 'rotate': if(!a1) throw new Error('keyId required'); await rotateKey(a1); break
      case 'disable': if(!a1) throw new Error('keyId required'); await setEnabled(a1, true); break
      case 'enable': if(!a1) throw new Error('keyId required'); await setEnabled(a1, false); break
      default:
        console.log('Commands: list | create <name> [role] | rotate <keyId> | disable <keyId> | enable <keyId>')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
