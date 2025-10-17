
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const specPath = path.join(__dirname,'../openapi/openapi.json')
const payloads = JSON.parse(fs.readFileSync(path.join(__dirname,'./fixtures/errors.payloads.json'),'utf-8'))

describe('OpenAPI error schema fixtures validate', () => {
  if (!fs.existsSync(specPath)) {
    it('skipped (no openapi.json)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  const ajv = new Ajv({ allErrors:true, strict:false }); addFormats(ajv)
  const sch = spec.components?.schemas || {}
  const map = {400:'Error400',401:'Error401',403:'Error403',404:'Error404',429:'Error429',503:'Error503'}
  for (const [code, ref] of Object.entries(map)){
    it(`error ${code} matches ${ref}`, () => {
      const schema = sch[ref as string]
      expect(schema).toBeTruthy()
      const v = ajv.compile(schema)
      const ok = v(payloads[code as keyof typeof payloads])
      if (!ok) console.error(v.errors)
      expect(ok).toBe(true)
    })
  }
})
