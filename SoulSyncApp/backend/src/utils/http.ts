import { requestWithCB } from './lib/httpClient'
export async function fetchWithTimeout(url: string, init: any = {}, ms = 15000){
  const ctrl = new AbortController()
  const id = setTimeout(()=> ctrl.abort(), ms)
  try{
    const resp = await requestWithCB(url, { ...init, signal: ctrl.signal })
    return resp
  }finally{
    clearTimeout(id)
  }
}
