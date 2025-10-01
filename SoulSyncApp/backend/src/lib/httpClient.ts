
import { CircuitBreaker } from './circuit'
import { httpFetch } from './http'

const cb = new CircuitBreaker(async (url:string, opts:any, signal:AbortSignal)=>{
  const res = await requestWithCB(url, { ...opts, signal })
  return res
}, { failureThreshold: 4, successThreshold: 2, timeoutMs: 8000, resetMs: 10000 })

export async function requestWithCB(url:string, opts:any = {}){
  return cb.call(url, opts)
}
