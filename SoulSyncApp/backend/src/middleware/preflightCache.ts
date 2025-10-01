export function preflightCache(){
  return (req:any, res:any, next:any)=>{
    if(req.method==='OPTIONS'){
      const max = String(process.env.CORS_MAX_AGE || 600)
      try{ res.setHeader('Access-Control-Max-Age', max) }catch{}
      return res.status(204).end()
    }
    next()
  }
}
