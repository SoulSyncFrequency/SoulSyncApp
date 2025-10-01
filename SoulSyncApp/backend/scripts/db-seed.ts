import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  const email = 'demo@soulsync.local'
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email }
  })
  await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7*24*60*60*1000)
    }
  })
  console.log('Seeded demo user:', email)
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
