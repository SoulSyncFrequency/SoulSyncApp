
import fs from 'fs'
import path from 'path'

describe('OpenAPI success responses exist', () => {
  const specPath = path.join(__dirname, '../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (no openapi.json)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  for (const p of Object.keys(spec.paths||{})){
    for (const m of Object.keys(spec.paths[p]||{})){
      const op = spec.paths[p][m]
      if (!op || typeof op!=='object') continue
      const codes = Object.keys(op.responses||{})
      const has2xx = codes.some(c => /^20[01]$/.test(c))
      it(`${m.toUpperCase()} ${p} declares 200/201`, ()=>{
        expect(has2xx).toBe(true)
      })
    }
  }
})
