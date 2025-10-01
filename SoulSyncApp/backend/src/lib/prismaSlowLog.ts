
import { Prisma } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export function attachPrismaSlowLogger(prisma: any){
  const threshold = Number(process.env.DB_SLOW_MS || '200')
  prisma.$on('query', (e: Prisma.QueryEvent) => {
    try{
      if (typeof e.duration === 'number' && e.duration >= threshold){
        const dir = path.join(process.cwd(), 'logs')
        fs.mkdirSync(dir, { recursive: true })
        const rec = { t: Date.now(), duration_ms: e.duration, query: e.query?.slice(0,2000), params: e.params?.slice(0,2000) }
        fs.appendFileSync(path.join(dir, 'db_slow.ndjson'), JSON.stringify(rec)+'\n', 'utf-8')
      }
    }catch{}
  })
}
