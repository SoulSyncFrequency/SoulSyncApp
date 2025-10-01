export function csp(){
  return (_req:any,res:any,next:any)=>{
    const pol = process.env.CONTENT_SECURITY_POLICY
    if(pol){ res.setHeader('Content-Security-Policy', pol) }
    next()
  }
}
