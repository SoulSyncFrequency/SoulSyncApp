export async function retry<T>(fn:()=>Promise<T>, opts: { retries?: number, factor?: number, min?: number } = {}){
  const retries = opts.retries ?? 3; const factor = opts.factor ?? 2; const min = opts.min ?? 200
  let attempt = 0, lastErr: any
  while(attempt <= retries){
    try{ return await fn() }catch(e){ lastErr = e; if(attempt===retries) break; const ms = min * Math.pow(factor, attempt); await new Promise(r=>setTimeout(r, ms)); attempt++ }
  }
  throw lastErr
}
