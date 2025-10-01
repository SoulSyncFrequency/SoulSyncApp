export function slowLog(){
  return (req:any, res:any, next:any)=>{
    const start = process.hrtime.bigint()
    res.on('finish', ()=>{
      try{
        const end = process.hrtime.bigint()
        const ms = Number(end - start) / 1e6
        const thr = Number(process.env.SLOW_MS || 400)
        if(ms > thr){
          try{ const client = require('prom-client'); if(process.env.PROMETHEUS_ENABLED==='1'){ const c = new client.Counter({ name:'slow_requests_total', help:'Requests slower than threshold' }); c.inc() } }catch{}
          const rid = res.getHeader('x-request-id') || ''
          console.warn('SLOW', ms.toFixed(1)+'ms', req.method, req.originalUrl, String(rid))
        }
      }catch{}
    })
    next()
  }
}
