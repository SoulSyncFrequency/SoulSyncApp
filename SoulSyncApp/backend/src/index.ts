import { logger } from './logger'
import './config'
import app from './app'
import http from 'http'
import { initRealtime } from './realtime/progress'
import { initCleanup } from './cron/cleanup'
import { initWeeklyBackup } from './cron/weeklyBackup'
import { initAdminAuditRetention } from './cron/adminAuditRetention'
import { logConfigSummary } from './startup'
import { registerSignals } from './graceful'
import { startSelfHealing } from './selfHealing'
import { startWorker } from './queue/worker'
import { startDailyCron } from './cron/dailyCron'

const port = Number(process.env.PORT || 3000)
registerSignals()
startSelfHealing()
const server = http.createServer(app)
const _cleanup = initCleanup()
const _weekly = initWeeklyBackup()
const _admret = initAdminAuditRetention()
server.keepAliveTimeout = Number(process.env.HTTP_KEEPALIVE_MS || 55000)
server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS || 60000)
server.requestTimeout = Number(process.env.HTTP_REQUEST_TIMEOUT_MS || 60000)
logConfigSummary()
server.listen(port, ()=> logger.info(`[server] listening on ${port}`))
initRealtime(app, server)

// Optional toggles via env
if(process.env.START_WORKER==='true'){ try { startWorker() } catch(e){ logger.warn('[worker] start failed', (e as unknown)?.message) } }
if(process.env.START_CRON==='true'){ try { startDailyCron() } catch(e){ logger.warn('[cron] start failed', (e as unknown)?.message) } }


// graceful shutdown
import { prisma } from './db/prismaClient'
let shuttingDown = false
function shutdown(server: any){
  if(shuttingDown) return
  shuttingDown = true
  const die = (code=0)=> process.exit(code)
  try{ server.close?.(()=>{ prisma?.$disconnect?.().finally(()=> die(0)) }) } catch { die(0) }
}
process.on('SIGINT', ()=> shutdown(server))
process.on('SIGTERM', ()=> shutdown(server))

process.on('unhandledRejection', (e:any)=> { try{ console.error('[unhandledRejection]', e?.message||e) }catch{} })
process.on('uncaughtException', (e:any)=> { try{ console.error('[uncaughtException]', e?.message||e); setTimeout(()=> process.exit(1), 200) }catch{} })
