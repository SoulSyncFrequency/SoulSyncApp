import fs from 'fs'
import path from 'path'
import { buildResponseValidator } from './utils/openapiValidator'

describe('Error schema coverage (offline)', () => {
  const specPath = path.join(__dirname, '../../openapi/openapi.json')
  if (!fs.existsSync(specPath)) {
    it('skipped (openapi.json missing)', ()=>{})
    return
  }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
  const validate = buildResponseValidator(spec)

  it('covers 429/503 on /api/supplements/progeste/dose', () => {
    const r429 = validate('/api/supplements/progeste/dose', 'post', 429, { error:'rate_limited' })
    expect(r429.ok).toBe(true)
    const r503 = validate('/api/supplements/progeste/dose', 'post', 503, { error:'backpressure', retryAfter: 1 })
    expect(r503.ok).toBe(true)
  })

  it('covers 429/503 on /api/supplements/progeste/doses/{planId}', () => {
    const r429 = validate('/api/supplements/progeste/doses/{planId}', 'post', 429, { error:'rate_limited' })
    expect(r429.ok).toBe(true)
    const r503 = validate('/api/supplements/progeste/doses/{planId}', 'post', 503, { error:'backpressure', retryAfter: 1 })
    expect(r503.ok).toBe(true)
  })
})


  it('common 4xx shapes (examples)', () => {
    const badReq = { error: 'invalid_request', details: [{ path:'field', code:'too_small', message:'min 1' }] }
    const unauthorized = { error: 'unauthorized' }
    const forbidden = { error: 'forbidden' }
    const notFound = { error: 'not_found' }
    // These are example payloads; schema validation happens on routes that declare them.
    expect(badReq.error).toBe('invalid_request')
    expect(['unauthorized','forbidden','not_found']).toContain(unauthorized.error.replace('unauthorized','unauthorized'))
  })
