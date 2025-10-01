const last = new Map<string, number>()
const WINDOW = Number(process.env.AUTO_TICKET_RATE_MINUTES || 360) * 60 * 1000

export async function autoTicket(key: string, fn: ()=> Promise<any>){
  const now = Date.now()
  const prev = last.get(key) || 0
  if(now - prev < WINDOW) return { ok:false, skipped: true, reason: 'rate_limited' }
  last.set(key, now)
  try{ return await fn() }catch(e:any){ return { ok:false, error: e?.message||String(e) } }
}
