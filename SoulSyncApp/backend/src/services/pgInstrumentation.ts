
// Optional PG instrumentation. Opt-in by importing wrapPgPool and using it on your pg.Pool instance.
// Controlled by ENV: PG_INSTRUMENT_ENABLED=true, SLOW_QUERY_MS=300
import fs from 'fs'
import path from 'path'

const SLOW_LOG = path.join(process.cwd(),'logs','sql_slow.ndjson')

function ensureDir(){
  try{ fs.mkdirSync(path.dirname(SLOW_LOG), { recursive: true }) }catch{}
}

export function wrapPgPool<T extends { query: Function }>(pool: T): T {
  if ((process.env.PG_INSTRUMENT_ENABLED||'false').toLowerCase()!=='true') return pool as T
  ensureDir()
  const orig = pool.query.bind(pool)
  pool.query = async function wrapped(...args:any[]){
    const start = Date.now()
    try{
      const res = await orig(...args)
      const dur = Date.now() - start
      const thr = Number(process.env.SLOW_QUERY_MS||'300')
      if (dur >= thr){
        const text = String(args[0]?.text || args[0] || '')
        const txt = text.replace(/\s+/g,' ').trim().slice(0, 5000)
        const entry = { t: Date.now(), ms: dur, text: txt }
        fs.appendFile(SLOW_LOG, JSON.stringify(entry)+'\n', ()=>{})
      }
      return res
    }catch(e:any){
      const dur = Date.now() - start
      const text = String(args[0]?.text || args[0] || '')
      const txt = text.replace(/\s+/g,' ').trim().slice(0, 5000)
      const entry = { t: Date.now(), ms: dur, text: txt, error: String(e?.message||e) }
      fs.appendFile(SLOW_LOG, JSON.stringify(entry)+'\n', ()=>{})
      throw e
    }
  } as any
  return pool
}
