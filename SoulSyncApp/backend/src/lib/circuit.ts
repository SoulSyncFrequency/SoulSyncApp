
type Fn<T=any> = (...a:any[])=>Promise<T>
export type CircuitOptions = { failureThreshold?: number; successThreshold?: number; timeoutMs?: number; resetMs?: number }

export class CircuitBreaker<T=any>{
  private state:'CLOSED'|'OPEN'|'HALF'='CLOSED'
  private failures=0
  private successes=0
  private nextTry=0
  constructor(private fn:Fn<T>, private opt:CircuitOptions={}){}
  async call(...args:any[]):Promise<T>{
    const now = Date.now()
    const { failureThreshold=5, successThreshold=2, timeoutMs=10000, resetMs=15000 } = this.opt
    if (this.state==='OPEN'){
      if (now < this.nextTry) throw new Error('circuit_open')
      this.state='HALF'
    }
    const ctrl = new AbortController()
    const timer = setTimeout(()=>ctrl.abort(), timeoutMs)
    try{
      const res = await this.fn(...args, ctrl.signal)
      clearTimeout(timer)
      if (this.state==='HALF'){
        this.successes++
        if (this.successes >= successThreshold){ this.state='CLOSED'; this.failures=0; this.successes=0 }
      }else{
        this.successes=0
      }
      return res
    }catch(e){
      clearTimeout(timer)
      this.failures++
      if (this.failures >= failureThreshold){
        this.state='OPEN'; this.nextTry = now + resetMs; this.successes=0
      }
      throw e
    }
  }
}
