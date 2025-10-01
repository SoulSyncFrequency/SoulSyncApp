
import { ZodSchema } from 'zod'

export function parseOrError<T>(schema: ZodSchema<T>, data: unknown){
  const r = (schema as any).safeParse(data)
  if (r.success) return r.data as T
  const details = r.error.issues.map((i:any)=>({ path: i.path?.join('.') || '', code: i.code, message: i.message }))
  const err:any = new Error('invalid_request')
  err.status = 400
  err.code = 'invalid_request'
  err.details = details
  throw err
}
