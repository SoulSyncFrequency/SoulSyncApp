import { logger } from './logger'

import { prisma } from '../src/db/prismaClient'

async function main(){
  const must = ['SMTP_HOST','EMAIL_FROM','FRONTEND_ORIGIN','NOTIFICATIONS_RETENTION_DAYS','DAILY_REPORT_HOUR']
  let ok = true
  for(const k of must){
    if(!process.env[k]){ logger.info('[ENV] Missing', k); ok=false }
  }
  try{ await (prisma as any).$queryRaw`SELECT 1`; logger.info('[DB] OK') }catch(e:any){ logger.info('[DB] FAIL', e?.message); ok=false }
  const tables = ['notification','webhookEndpoint','webhookLog','emailLog']
  for(const n of tables){
    try{ await (prisma as any)[n].findFirst({ take:1 }); logger.info(`[TABLE] ${n} OK`) }catch(e:any){ logger.info(`[TABLE] ${n} FAIL`) }
  }
  process.exit(ok?0:1)
}

main()
