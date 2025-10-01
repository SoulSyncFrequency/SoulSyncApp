import compression from 'compression'

export function compressionSafe(){
  // skip SSE
  return compression({ filter: (req,res)=>{
    const type = res.getHeader('Content-Type') || ''
    if(String(type).includes('text/event-stream')) return false
    return compression.filter(req,res)
  }})
}
