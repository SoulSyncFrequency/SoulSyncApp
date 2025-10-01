import cors from 'cors'

export function corsConfigured(){
  const raw = process.env.CORS_ALLOWED_ORIGINS || ''
  const allow = raw.split(',').map(s=>s.trim()).filter(Boolean)
  if (allow.length === 0) {
    const origins = (process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)
  return cors({
    preflightContinue: false,
    maxAge: 600,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    exposedHeaders: ['x-request-id','RateLimit-Limit','RateLimit-Remaining','RateLimit-Reset'],
    allowedHeaders: ['Content-Type','Authorization','x-csrf-token','x-request-id'], origin: false }) // same-origin only
  }
  const origins = (process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)
  return cors({
    preflightContinue: false,
    maxAge: 600,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    exposedHeaders: ['x-request-id','RateLimit-Limit','RateLimit-Remaining','RateLimit-Reset'],
    allowedHeaders: ['Content-Type','Authorization','x-csrf-token','x-request-id'],
    origin: function (origin, cb) {
      if (!origin) return cb(null, true) // non-browser or same-origin
      if (allow.includes(origin)) return cb(null, true)
      return cb(new Error('CORS not allowed'), false)
    },
    credentials: true
  })
}


export function addVaryOrigin(){
  return (_req:any, res:any, next:any)=>{
    try{
      const prev = String(res.getHeader('Vary')||'')
      if(!/\bOrigin\b/i.test(prev)){
        res.setHeader('Vary', prev ? prev+', Origin' : 'Origin')
      }
    }catch{}
    next()
  }
}


// Expose useful headers for browsers
export function exposeUsefulHeaders(){
  return (_req:any,res:any,next:any)=>{ res.setHeader('Access-Control-Expose-Headers','X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After, X-Response-Time'); next() }
}
