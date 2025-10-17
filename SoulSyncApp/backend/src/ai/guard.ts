import { ai } from '.'

export type Shape = Record<string, 'string'|'number'|'boolean'|'object'|'array'|Shape>

function validateShape(obj:any, shape:Shape, path='$', errors:string[]=[]){
  if(typeof shape === 'string'){
    if(shape==='array'){ if(!Array.isArray(obj)) errors.push(`${path} should be array`) }
    else if(shape==='object'){ if(typeof obj!=='object'||obj===null||Array.isArray(obj)) errors.push(`${path} should be object`) }
    else if(typeof obj !== shape) errors.push(`${path} should be ${shape}`)
    return errors
  }
  if(typeof shape === 'object'){
    if(typeof obj!=='object'||obj===null){ errors.push(`${path} should be object`); return errors }
    for(const k of Object.keys(shape)){ validateShape(obj?.[k], (shape as any)[k], `${path}.${k}`, errors) }
  }
  return errors
}

export async function guardedJSON<T=any>(prompt:string, shape:Shape, attempts=2): Promise<{ ok:boolean; data?:T; raw?:string; errors?:string[] }>{ 
  let raw=''; let lastErrs:string[]=[]
  for(let i=0;i<=attempts;i++){
    const p = i===0 ? prompt : `${prompt}\nIf previous output didn't match schema, fix and output ONLY JSON.`
    raw = await ai.summarize(p, { maxTokens: 800 } as any)
    try{
      const json = JSON.parse(raw)
      const errs = validateShape(json, shape)
      if(errs.length===0) return { ok:true, data: json as T, raw }
      lastErrs = errs
    }catch(e){ lastErrs=['invalid_json'] }
  }
  return { ok:false, raw, errors: lastErrs }
}
