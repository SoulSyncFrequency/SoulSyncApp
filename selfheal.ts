import fs from 'fs-extra'
import path from 'path'
import { ensureSQLite, pingDB } from './db/index.js'

/**
 * Self-heal agent:
 *  - Ensures data directories exist
 *  - Pings DB and re-initializes SQLite if ping fails
 *  - Cleans up old report files (>30 days)
 */
export async function selfHealBootstrap() {
  const dataDir = path.join(process.cwd(), 'data')
  await fs.ensureDir(dataDir)
  try {
    await pingDB()
  } catch (e) {
    console.error('[selfheal] DB ping failed, attempting re-init...', e)
    await ensureSQLite()
  }
  // schedule periodic tasks
  setInterval(async () => {
    try {
      await pingDB()
    } catch {
      console.error('[selfheal] DB ping failed, attempting re-init...')
      await ensureSQLite()
    }
    await cleanupReports()
  }, 60_000) // every minute
}

async function cleanupReports(){
  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  try {
    await fs.ensureDir(reportsDir)
    const files = await fs.readdir(reportsDir)
    const now = Date.now()
    await Promise.all(files.map(async f => {
      const full = path.join(reportsDir, f)
      const stat = await fs.stat(full)
      if (now - stat.mtimeMs > 30*24*60*60*1000) { // 30 days
        await fs.remove(full)
      }
    }))
  } catch (e) {
    // ignore
  }
}
