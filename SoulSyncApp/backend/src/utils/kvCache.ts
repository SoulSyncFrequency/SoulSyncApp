type Entry = { value:any, exp:number, stale?: any, staleExp?: number }
const MEM = new Map<string, Entry>()

export async function kvGet(key:string){
  const e = MEM.get(key)
  if(!e) return null
  const now = Date.now()
  if(e.exp && e.exp > now) return e.value
  return null
}

export async function kvSet(key:string, value:any, ttlSec:number, opts?:{ staleSec?: number }){
  const now = Date.now()
  const staleSec = Math.max(0, Number(opts?.staleSec||0))
  const old = MEM.get(key)
  const entry: Entry = { value, exp: now + ttlSec*1000 }
  if(staleSec>0){
    entry.stale = (old && (old.exp>now? old.value : (old.staleExp && old.staleExp>now ? old.stale : null))) || value
    entry.staleExp = now + (ttlSec+staleSec)*1000
  }
  MEM.set(key, entry)
}

export async function kvGetStale(key:string){
  const e = MEM.get(key); const now = Date.now()
  if(!e) return null
  if(e.staleExp && e.staleExp>now) return e.stale
  return null
}
