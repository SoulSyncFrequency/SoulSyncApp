
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/ops/backup-status', (_req, res) => {
  try{
    const dir = path.join(process.cwd(),'backups')
    let lastDb:string|null = null
    let lastRedis:string|null = null
    if (fs.existsSync(dir)){
      const files = fs.readdirSync(dir).sort()
      const dbs = files.filter(f=>f.startsWith('db_'))
      const reds = files.filter(f=>f.startsWith('redis_'))
      if (dbs.length) lastDb = dbs[dbs.length-1]
      if (reds.length) lastRedis = reds[reds.length-1]
    }
    res.json({ ok:true, lastDbBackup:lastDb, lastRedisBackup:lastRedis })
  }catch(e:any){
    res.status(500).json({ error:'backup_status_error', message:String(e?.message||e) })
  }
})

export default router
