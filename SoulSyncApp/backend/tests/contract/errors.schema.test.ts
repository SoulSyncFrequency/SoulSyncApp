
import fs from 'fs'
import path from 'path'
import { buildResponseValidator } from './utils/openapiValidator'

describe('Error/Throttle schema validation (offline)', () => {
  const specPath = path.join(__dirname, '../../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (openapi.json missing)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
  const validate = buildResponseValidator(spec)
  it('429 shape matches ErrorResponse', () => {
    const ex = { error: 'rate_limited', details: { limit: 60 } }
    const res = validate('/api/supplements/progeste/dose', 'post', 429, ex)
    expect(res.ok).toBe(true)
  })
  it('503 shape matches ThrottleResponse', () => {
    const ex = { error: 'backpressure', retryAfter: 1 }
    const res = validate('/api/therapy/generate', 'post', 503, ex)
    expect(res.ok).toBe(true)
  })
})
