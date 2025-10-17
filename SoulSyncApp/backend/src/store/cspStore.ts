type CspReport = { ts:number, 'csp-report'?: any, [k:string]: any }
const MAX = Number(process.env.CSP_STORE_MAX || 2000)
const buf: CspReport[] = []

export function pushReport(rep:any){
  const item = { ts: Date.now(), ...rep }
  buf.push(item)
  if(buf.length>MAX){ buf.splice(0, buf.length-MAX) }
  return item
}

export function listReports(sinceMs?:number){
  const cutoff = sinceMs ? (Date.now()-sinceMs) : 0
  return buf.filter(it=> it.ts>=cutoff)
}

export function groupedByDirective(sinceMs?:number){
  const list = listReports(sinceMs)
  const groups: Record<string, number> = {}
  for(const it of list){
    const r = it['csp-report'] || it
    const key = `${r['violated-directive']||'unknown'}||${r['blocked-uri']||'unknown'}`
    groups[key] = (groups[key]||0)+1
  }
  return Object.entries(groups).map(([k,v])=>{
    const [directive, blocked] = k.split('||')
    return { directive, blocked, count: v }
  }).sort((a,b)=> b.count-a.count)
}

export function clearReports(){ buf.splice(0, buf.length) }
