// src/services/suggestions.ts
import fs from 'fs-extra'
import path from 'path'

export type SuggestionOp = 'set' | 'unset'
export interface Suggestion {
  path: string // dot-path e.g., "a.b.c[0].d"
  value?: any
  op?: SuggestionOp
  score?: number // optional confidence 0..1
}

const __PP_FORBIDDEN = new Set(['__proto__','prototype','constructor'])

export interface ApplyOptions {
  autoTune?: boolean
  backupDir?: string
  dryRun?: boolean
}

function setByPath(obj:any, p:string, val:any){
  const parts = p.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  if(parts.some(k=> __PP_FORBIDDEN.has(k))) throw new Error('forbidden_key')
  let cur = obj
  for(let i=0;i<parts.length-1;i++){
    const k = parts[i]
    if(!(k in cur) || typeof cur[k] !== 'object' || cur[k]===null){
      const isIndex = /^\d+$/.test(parts[i+1]||'')
      cur[k] = isIndex ? [] : {}
    }
    cur = cur[k]
  }
  const last = parts[parts.length-1]
  cur[last] = val
}

function unsetByPath(obj:any, p:string){
  const parts = p.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  if(parts.some(k=> __PP_FORBIDDEN.has(k))) throw new Error('forbidden_key')
  let cur = obj
  for(let i=0;i<parts.length-1;i++){
    const k = parts[i]
    if(!(k in cur)) return
    cur = cur[k]
    if(typeof cur !== 'object' || cur===null) return
  }
  const last = parts[parts.length-1]
  if(Array.isArray(cur)){
    const idx = Number(last)
    if(!Number.isNaN(idx)) cur.splice(idx,1)
  } else {
    delete cur[last]
  }
}

export function deepClone<T>(x:T):T{ return JSON.parse(JSON.stringify(x)) }

export function applySuggestions(doc:any, suggestions: Suggestion[], opts: ApplyOptions = {}){
  const base = deepClone(doc)
  const applied: Suggestion[] = []
  const conflicts: { path:string, kept:'original'|'suggestion', reason:string }[] = []

  // group by path
  const byPath = new Map<string, Suggestion[]>()
  for(const s of suggestions){
    const arr = byPath.get(s.path) || []
    arr.push(s)
    byPath.set(s.path, arr)
  }

  for(const [p, arr] of byPath.entries()){
    if(arr.length === 1){
      const s = arr[0]
      if((s.op||'set') === 'unset') unsetByPath(base, p)
      else setByPath(base, p, s.value)
      applied.push(s)
      continue
    }
    // conflict
    const sorted = [...arr].sort((a,b)=> (b.score||0) - (a.score||0))
    if(opts.autoTune){
      const best = sorted[0]
      if((best.op||'set') === 'unset') unsetByPath(base, p)
      else setByPath(base, p, best.value)
      applied.push(best)
      conflicts.push({ path:p, kept:'suggestion', reason:'autoTune pick by score' })
    } else {
      conflicts.push({ path:p, kept:'original', reason:'multiple suggestions' })
    }
  }

  return { result: base, applied, conflicts }
}

export async function backupDocument(collection:string, id:string, original:any, backupDir?:string){
  const dir = backupDir || path.join(process.cwd(), 'backups', collection, id)
  await fs.ensureDir(dir)
  const file = path.join(dir, `${Date.now()}.json`)
  await fs.writeJson(file, original, { spaces: 2 })
  return file
}
