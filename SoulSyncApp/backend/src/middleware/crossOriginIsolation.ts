export function crossOriginIsolation(){
  return (_req:any, res:any, next:any)=>{
    if(process.env.CROSS_ORIGIN_ISOLATION==='1'){
      res.setHeader('Cross-Origin-Opener-Policy','same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy','require-corp')
      res.setHeader('Cross-Origin-Resource-Policy','same-site')
    }
    next()
  }
}
