export function rateLimitHeaders(){
  return (req:any,res:any,next:any)=>{
    const origJson = res.json.bind(res)
    const origSend = res.send.bind(res)
    function setHeaders(){
      try{
        const info:any = (req as any).rateLimit
        if(res.statusCode===429 && info){
          const now = Math.floor(Date.now()/1000)
          const limit = Number(info.limit||process.env.RL_LIMIT_DEFAULT||0)||0
          const remaining = Math.max(0, Number(info.remaining||0))
          const reset = Number(info.resetTime ? Math.floor(new Date(info.resetTime).getTime()/1000) : now + Number(process.env.RL_WINDOW_SEC||process.env.RL_RETRY_AFTER_DEFAULT||60))
          const retry = Math.max(1, reset - now)
          res.setHeader('Retry-After', String(retry))
          if(limit) res.setHeader('X-RateLimit-Limit', String(limit))
          res.setHeader('X-RateLimit-Remaining', String(remaining))
          res.setHeader('X-RateLimit-Reset', String(reset))
          return
        }
      }catch{}
      if(res.statusCode===429){
        const now = Math.floor(Date.now()/1000)
        const limit = Number(process.env.RL_LIMIT_DEFAULT||'0')||0
        const remaining = 0
        const resetIn = Number(process.env.RL_WINDOW_SEC||process.env.RL_RETRY_AFTER_DEFAULT||60)
        const reset = now + resetIn
        if(!res.getHeader('Retry-After')) res.setHeader('Retry-After', String(resetIn))
        if(limit) res.setHeader('X-RateLimit-Limit', String(limit))
        if(res.getHeader('X-RateLimit-Remaining')===undefined) res.setHeader('X-RateLimit-Remaining', String(remaining))
        if(res.getHeader('X-RateLimit-Reset')===undefined) res.setHeader('X-RateLimit-Reset', String(reset))
      }
    }
    res.json = (body:any)=>{ setHeaders(); return origJson(body) }
    res.send = (body:any)=>{ setHeaders(); return origSend(body) }
    next()
  }
}
