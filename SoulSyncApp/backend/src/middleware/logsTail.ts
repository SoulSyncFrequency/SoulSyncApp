const RING:any[] = []
const CAP = Number(process.env.TAIL_CAP || 500)

function maskQuery(u:string){
  try{
    const url = new URL(u, 'http://x')
    const sens = [/token/i,/key/i,/secret/i,/password/i,/authorization/i]
    sens.forEach(rx=>{ for(const k of Array.from(url.searchParams.keys())){ if(rx.test(k)){ url.searchParams.set(k, '***') } } })
    return url.pathname + (url.search ? ('?'+url.searchParams.toString()) : '')
  }catch{ return u }
}
export function collectTail(){
  return (req:any, res:any, next:any)=>{
    const t = Date.now()
    res.on('finish', ()=>{
      try{
        const item = { ts: t, ms: Date.now()-t, method: req.method, url: maskQuery(req.originalUrl||''), status: res.statusCode, id: (res.getHeader && res.getHeader('x-request-id')) || (req as any).requestId }
        RING.push(item); if(RING.length>CAP) RING.splice(0, RING.length-CAP)
      }catch{}
    })
    next()
  }
}
export function readTail(limit=100){
  const n = Math.max(1, Math.min(Number(limit||100), CAP))
  return RING.slice(-n)
}


export function __clear(){
  try{ RING.splice(0, RING.length) }catch{}
}
