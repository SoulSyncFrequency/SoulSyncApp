export function safeModeGuard(){
  const blocked = [
    /^\/api\/admin\/heapdump\b/,
    /^\/api\/admin\/ops\/summary\b/,
    /^\/api\/admin\/audit\/summarize\b/,
    /^\/api\/admin\/audit\/export/i,
    /^\/api\/admin\/reports\/upload\b/,
    /^\/api\/admin\/stats\/export\b/
  ]
  return (req:any, res:any, next:any)=>{
    if(process.env.SAFE_MODE==='1'){ const extra = patternsFromEnv()
      const p = String(req.path||''); if(blocked.some(rx=> rx.test(p)) || extra.some((rx:any)=> rx.test(p))){
        return res.status(403).json({ ok:false, code:'safe_mode', message:'Action disabled in SAFE_MODE' })
      }
    }
    next()
  }
}


function globToRx(g:string){
  // simple glob: * -> .*, ? -> ., escape others
  const esc = g.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')
  return new RegExp('^'+esc+'$','i')
}
function patternsFromEnv(){
  try{
    const raw = String(process.env.SAFE_BLOCK||'').trim()
    if(!raw) return []
    return raw.split(',').map(s=> s.trim()).filter(Boolean).map(globToRx)
  }catch{ return [] }
}
