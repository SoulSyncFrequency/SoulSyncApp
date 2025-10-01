
import { monitorEventLoopDelay } from 'perf_hooks'

const hist = monitorEventLoopDelay({ resolution: 20 })
hist.enable()

export function loopLagSummary(){
  try{
    const mean = Math.round(hist.mean/1e6) // ns to ms
    const p99 = Math.round(hist.percentile(99)/1e6)
    const max = Math.round(hist.max/1e6)
    return { meanMs: mean, p99Ms: p99, maxMs: max }
  }catch(e:any){
    return { meanMs: -1, p99Ms: -1, maxMs: -1 }
  }
}
