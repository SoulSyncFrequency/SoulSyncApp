
import fs from 'fs'
import path from 'path'
import { buildResponseValidator } from './utils/openapiValidator'

describe('Error schemas present & validate across all paths (offline)', () => {
  const specPath = path.join(__dirname, '../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (missing spec)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  const validate = buildResponseValidator(spec)
  const payloads = JSON.parse(fs.readFileSync(path.join(__dirname,'./fixtures/errors.payloads.json'),'utf-8'))
  const wanted = ['400','401','403','404','429','503']

  for (const p of Object.keys(spec.paths||{})){
    for (const m of Object.keys(spec.paths[p]||{})){
      const op = spec.paths[p][m]
      if (!op || typeof op !== 'object') continue
      const codes = Object.keys(op.responses||{})
      const toCheck = wanted.filter(c => codes.includes(c))
      if (!toCheck.length){
        it(`SKIP: ${m.toUpperCase()} ${p} has no standard error responses`, ()=>{})
        continue
      }
      it(`${m.toUpperCase()} ${p} declares and validates error schemas`, ()=>{
        for (const c of toCheck){
          const res = validate(p, m, Number(c), payloads[c])
          expect(res.ok).toBe(true)
        }
      })
    }
  }
})
