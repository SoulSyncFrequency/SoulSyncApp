export function httpsEnforce(){
  return (req:any, res:any, next:any)=>{
    if(process.env.FORCE_HTTPS==='1'){
      const proto = req.headers['x-forwarded-proto'] || req.protocol
      if(proto !== 'https') return res.redirect(301, 'https://' + req.headers.host + req.originalUrl)
    }
    next()
  }
}
