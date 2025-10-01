export async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, tries = 3, delayMs = 400, timeoutMs = 8000): Promise<Response>{
  let lastErr: any = null
  for (let i=0;i<tries;i++){
    const controller = new AbortController()
    const t = setTimeout(()=>controller.abort(), timeoutMs * Math.pow(1.2, i))
    try{
      const headers = new Headers(init.headers || {})
      headers.set('X-Idempotency-Key', (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Math.random()))
      headers.set('X-Client', 'SoulSyncFE')
      const res = await fetch(input, { ...init, headers, signal: controller.signal })
      if (res.ok) { clearTimeout(t); return res }
      // 4xx -> no retry except 429
      if (res.status >= 400 && res.status < 500 && res.status !== 429) { clearTimeout(t); return res }
      lastErr = new Error(`HTTP ${res.status}`)
    }catch(e){ lastErr = e }
    await new Promise(r => setTimeout(r, Math.round((delayMs * Math.pow(2,i)) * (0.8 + Math.random()*0.4))))
  }
  throw lastErr
}
