
import fs from 'fs'
import path from 'path'

describe('OpenAPI paths snapshot (presence, offline)', () => {
  const specPath = path.join(__dirname, '../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (no openapi.json)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  const paths = Object.keys(spec.paths||{})
  it('contains key ops & supplements endpoints', () => {
    const must = ['/ops/status','/api/supplements/summary','/api/supplements/export','/admin/audit/admin-actions']
    for (const p of must){
      expect(paths).toContain(p)
    }
  })
})
