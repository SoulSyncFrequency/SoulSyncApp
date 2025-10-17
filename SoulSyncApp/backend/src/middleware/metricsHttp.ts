export function metricsHttp(){
  let client: any = null, Histogram: any = null
  try{ client = require('prom-client'); Histogram = client.Histogram }catch{}
  if(!client || !Histogram || process.env.PROM_METRICS_HTTP !== '1'){
    return (_req:any,_res:any,next:any)=> next()
  }
  const hist = new Histogram({ name:'http_server_duration_seconds', help:'HTTP latency', labelNames:['method','route','status'], buckets:[0.01,0.05,0.1,0.25,0.5,1,2,5] })
  return (req:any, res:any, next:any)=>{
    const start = process.hrtime.bigint()
    res.on('finish', ()=>{
      const dur = Number((process.hrtime.bigint() - start)/BigInt(1_000_000))/1000
      const route = (req.route && req.route.path) || req.path || 'unknown'
      hist.observe({ method:req.method, route, status:String(res.statusCode) }, dur)
    })
    next()
  }
}
