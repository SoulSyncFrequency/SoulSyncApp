export function hsts(){
  return (_req:any, res:any, next:any)=>{
    if(process.env.HSTS_ENABLE==='1' || process.env.FORCE_HTTPS==='1'){
      const max = process.env.HSTS_MAX_AGE || '63072000' // 2y
      const inc = process.env.HSTS_INCLUDE_SUBDOMAINS==='1' ? '; includeSubDomains' : ''
      const preload = process.env.HSTS_PRELOAD==='1' ? '; preload' : ''
      res.setHeader('Strict-Transport-Security', `max-age=${max}${inc}${preload}`)
    }
    next()
  }
}
