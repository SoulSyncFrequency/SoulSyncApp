const badKeys = new Set(['__proto__','prototype','constructor'])
function scrub(obj:any, depth=0){
  if(!obj || typeof obj!=='object' || depth>6) return obj
  if(Array.isArray(obj)){ for(let i=0;i<obj.length;i++) obj[i]=scrub(obj[i], depth+1); return obj }
  for(const k of Object.keys(obj)){
    if(badKeys.has(k)){ delete obj[k]; continue }
    obj[k] = scrub(obj[k], depth+1)
  }
  return obj
}
export function sanitizeBody(){
  return (req:any,_res:any,next:any)=>{ try{ if(req.body) scrub(req.body) }catch{} next() }
}
