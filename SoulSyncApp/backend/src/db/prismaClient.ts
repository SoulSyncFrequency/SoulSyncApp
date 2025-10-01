// Safe Prisma client (optional at runtime)
let Prisma: unknown; try { Prisma = require('@prisma/client'); } catch {}
export const prisma = Prisma ? new Prisma.PrismaClient() : null;


// Slow query logger
const slowMs = Number(process.env.PRISMA_SLOW_MS || 200)
if ((prisma as any).$use){
  ;(prisma as any).$use(async (params: any, next: any) => {
    const start = Date.now()
    const result = await next(params)
    const dur = Date.now() - start
    if (dur > slowMs) {
      console.warn('[prisma][slow]', dur+'ms', params?.model, params?.action)
    }
    return result
  })
}
