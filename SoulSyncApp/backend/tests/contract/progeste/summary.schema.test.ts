
import fs from 'fs'
import path from 'path'
import { buildResponseValidator } from '../utils/openapiValidator'

describe('OpenAPI schema validation (offline)', () => {
  const specPath = path.join(__dirname, '../../../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (openapi.json missing)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
  const validate = buildResponseValidator(spec)

  it('summary endpoint response shape matches schema (example payload)', () => {
    const pathKey = '/api/supplements/progeste/summary/{planId}'
    const example = { summary: { doses: 3, totalAmount: 6, unit: 'drop', avgMood: 4.3, avgSleep: 3.7, avgAnxiety: 2.1, avgCramps: 1.2 }, ai: null, disclaimer: 'Informational only. Not medical advice.' }
    const res = validate(pathKey, 'get', 200, example)
    expect(res.ok).toBe(true)
  })
})
