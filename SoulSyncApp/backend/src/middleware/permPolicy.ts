export function permissionsPolicy(){
  return (_req:any,res:any,next:any)=>{
    res.setHeader('Permissions-Policy', [
      "camera=()","microphone=()","geolocation=()","fullscreen=(self)","payment=()","autoplay=(self)"
    ].join(', '))
    next()
  }
}
