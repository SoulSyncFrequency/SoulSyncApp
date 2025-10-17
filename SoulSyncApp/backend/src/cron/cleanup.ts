// Daily cleanup of old reports and audit records (retention days)
export function initCleanup(){
  let cron: any = null
  try{ cron = require('node-cron') }catch{ return null }
  const fs = require('fs')
  const path = require('path')
  const fse = require('fs-extra')
  const days = Number(process.env.RETAIN_DAYS || 14)
  const cutoff = ()=> Date.now() - days*24*60*60*1000
  const olderThan = (p:string)=>{
    try{ const st = fs.statSync(p); return st.mtimeMs < cutoff() }catch{ return false }
  }
  const rmOld = (dir:string)=>{
    try{
      if(!fs.existsSync(dir)) return
      for(const f of fs.readdirSync(dir)){
        const fp = path.join(dir, f)
        if(olderThan(fp)) fse.removeSync(fp)
      }
    }catch{}
  }
  // Run daily at 02:10
  const task = cron.schedule('10 2 * * *', ()=>{
    try{
      rmOld(path.join(process.cwd(), 'reports'))
      rmOld(path.join(process.cwd(), 'audit'))
      rmOld(path.join(process.cwd(), 'backups'))
    }catch{}
  })
  return task
}
