
import { OpenAPIV3 } from 'openapi-types'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

export function buildResponseValidator(spec: OpenAPIV3.Document){
  const ajv = new Ajv({ allErrors:true, strict:false })
  addFormats(ajv)
  return function validate(path:string, method:string, status:number, body:any){
    const p = (spec.paths as any)[path]
    if (!p) return { ok:true, details:'path not in spec' }
    const op = (p as any)[method.toLowerCase()]
    if (!op) return { ok:true, details:'method not in spec' }
    const resp = op.responses?.[status] || op.responses?.['200']
    if (!resp) return { ok:true, details:'response schema not found' }
    const content = (resp as any).content?.['application/json']
    if (!content || !content.schema) return { ok:true, details:'no json schema' }
    const validate = ajv.compile(content.schema as any)
    const ok = validate(body)
    return { ok: !!ok, details: validate.errors || null }
  }
}


export function expectedStatuses(spec: OpenAPIV3.Document, path:string, method:string){
  const p = (spec.paths as any)[path]; if (!p) return [200]
  const op = (p as any)[method.toLowerCase()]; if (!op) return [200]
  const keys = Object.keys(op.responses||{})
  return keys.map(k => Number(k)).filter(n=>!Number.isNaN(n))
}


export function validateError(spec:any, path:string, method:string, status:number, body:any){
  const p = spec.paths?.[path]; if (!p) return { ok:true }
  const op = p?.[method.toLowerCase()]; if (!op) return { ok:true }
  const resp = op.responses?.[String(status)]
  if (!resp) return { ok:true, details:'no error resp in spec' }
  const schema = resp?.content?.['application/json']?.schema
  if (!schema) return { ok:true, details:'no schema' }
  const Ajv = (await import('ajv')).default
  const addFormats = (await import('ajv-formats')).default
  const ajv = new Ajv({ allErrors:true, strict:false })
  addFormats(ajv)
  const v = ajv.compile(schema)
  const ok = v(body)
  return { ok: !!ok, details: v.errors || null }
}
