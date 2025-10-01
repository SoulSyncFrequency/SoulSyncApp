import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(){
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const pass = process.env.SEED_ADMIN_PASS || 'admin123'
  const hash = await bcrypt.hash(pass, 12)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing){
    await prisma.user.create({ data: { email, passwordHash: hash, role:'admin' } })
    console.log('Seeded admin:', email)
  } else {
    console.log('Admin already exists')
  }
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
