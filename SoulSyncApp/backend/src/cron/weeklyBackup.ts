export function initWeeklyBackup(){
  let cron: any = null
  try{ cron = require('node-cron') }catch{ return null }
  const { spawn } = require('child_process')
  // Every Sunday 03:20
  const task = cron.schedule('20 3 * * 0', ()=>{
    try{ spawn('node', ['scripts/backup_audit_reports.mjs'], { cwd: process.cwd(), stdio: 'ignore', detached: true }) }catch{}
  })
  return task
}
