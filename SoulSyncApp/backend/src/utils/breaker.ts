import CircuitBreaker from 'opossum'

export function withBreaker<TArgs extends any[], TRes>(fn: (...args:TArgs)=>Promise<TRes>){
  if (process.env.FEATURE_BREAKERS !== 'on') return fn
  const brk = new CircuitBreaker(fn as any, {
    timeout: Number(process.env.BRK_TIMEOUT || 5000),
    errorThresholdPercentage: Number(process.env.BRK_ERR_PCT || 50),
    resetTimeout: Number(process.env.BRK_RESET || 10000)
  })
  return ((...args: TArgs) => brk.fire(...args)) as typeof fn
}
