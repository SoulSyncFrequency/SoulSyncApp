import fs from 'fs'
import path from 'path'

export function startLogsCleanup(){
  const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs')
  const TTL_DAYS = Number(process.env.LOG_TTL_DAYS || 30)
  const ttlMs = TTL_DAYS * 24 * 60 * 60 * 1000
  function sweep(){
    try{
      if(!fs.existsSync(LOG_DIR)) return
      const now = Date.now()
      for(const f of fs.readdirSync(LOG_DIR)){
        const full = path.join(LOG_DIR, f)
        const st = fs.statSync(full)
        if((now - st.mtimeMs) > ttlMs) fs.unlinkSync(full)
      }
    }catch{}
  }
  setInterval(sweep, 12*60*60*1000).unref()
  sweep()
}
