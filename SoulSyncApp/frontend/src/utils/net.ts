export async function apiFetch(url:string, opts:any={}){
  const method = (opts.method||'GET').toUpperCase()
  const headers: Record<string,string> = { ...(opts.headers||{}) }
  let idem = headers['Idempotency-Key']
  if(['POST','PUT','PATCH','DELETE'].includes(method)){
    if(!idem){ idem = cryptoRandom(); headers['Idempotency-Key'] = idem }
    if(!headers['Content-Type'] && opts.body && typeof opts.body!=='string'){
      headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(opts.body)
    }
  }
  const attempt = async (i:number)=>{
    try{
      const res = await fetch(url, { ...opts, headers, credentials:'include' })
      if(res.status===409 || res.status===429){
        if(i>=2) return res
        await delay(i===0?300:700); return attempt(i+1)
      }
      return res
    }catch(e){
      if(i>=2) throw e
      await delay(i===0?300:700); return attempt(i+1)
    }
  }
  return attempt(0)
}
function cryptoRandom(){
  try{ const a=new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('') }
  catch{ return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2) }
}
function delay(ms:number){ return new Promise(r=>setTimeout(r,ms)) }
