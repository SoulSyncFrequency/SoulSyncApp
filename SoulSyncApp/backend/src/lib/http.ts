import { requestWithCB } from './lib/httpClient'

export type HttpOptions = {
  method?: string
  headers?: Record<string,string>
  body?: any
  timeoutMs?: number
  retries?: number
  backoffMs?: number
}

export async function requestWithCB(url:string, opts:HttpOptions = {}){
  const { timeoutMs = 10000, retries = 1, backoffMs = 300, ...rest } = opts
  let attempt = 0
  let lastErr: any = null
  while (attempt <= retries){
    const ctrl = new AbortController()
    const t = setTimeout(()=> ctrl.abort(), timeoutMs)
    try{
      const res = await requestWithCB(url, { ...rest, signal: ctrl.signal } as any)
      clearTimeout(t)
      return res
    } catch(e){
      clearTimeout(t)
      lastErr = e
      if (attempt === retries) break
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)))
    }
    attempt++
  }
  throw lastErr
}
