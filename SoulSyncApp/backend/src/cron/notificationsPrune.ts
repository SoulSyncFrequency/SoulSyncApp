import fs from 'fs'
import path from 'path'
import { prisma } from '../db/prismaClient'

const ARCHIVE_DIR = path.join(process.cwd(), 'archives', 'notifications')
if(!fs.existsSync(path.join(process.cwd(),'archives'))) fs.mkdirSync(path.join(process.cwd(),'archives'))
if(!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR)

const CRITICAL = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']

export async function pruneNotifications(){
  const days = Number(process.env.NOTIFICATIONS_RETENTION_DAYS || 180)
  const onlyCritical = String(process.env.NOTIF_ARCHIVE_MODE||'all')==='critical'
  const cutoff = new Date(Date.now() - days*24*60*60*1000)
  if(!prisma) return { archived:0, deleted:0, mode: 'no-db' }

  const where: unknown = { createdAt: { lt: cutoff } }
  const list = await (prisma as unknown).notification.findMany({ where, orderBy: { createdAt: 'asc' } })
  if(list.length===0) return { archived:0, deleted:0, mode: 'none' }

  const toArchive = onlyCritical ? list.filter((n: unknown)=> CRITICAL.includes(n.type)) : list
  const fname = 'notifications_' + new Date().toISOString().slice(0,10) + '.csv'
  const fpath = path.join(ARCHIVE_DIR, fname)

  // build CSV
  const headers = ['id','userId','type','message','meta','read','createdAt']
  const lines = [headers.join(',')]
  for(const n of toArchive){
    const row = [n.id, n.userId??'', JSON.stringify(n.type), JSON.stringify(n.message??''), JSON.stringify(n.meta??null), n.read, n.createdAt.toISOString()]
    lines.push(row.join(','))
  }
  fs.writeFileSync(fpath, lines.join('\n'), 'utf8')

  // delete all old (not just archived subset) to keep DB clean
  const del = await (prisma as unknown).notification.deleteMany({ where })
  return { archived: toArchive.length, deleted: del.count, file: fname, cutoff }
}