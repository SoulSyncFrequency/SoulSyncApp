export function secHeaders(){
  return (_req:any, res:any, next:any)=>{
    res.setHeader('Referrer-Policy', process.env.REFERRER_POLICY || 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', process.env.X_FRAME_OPTIONS || 'DENY')
    next()
  }
}
