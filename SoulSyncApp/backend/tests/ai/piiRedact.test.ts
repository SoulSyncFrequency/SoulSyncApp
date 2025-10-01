import { redactPII } from '../../src/utils/piiRedact'

describe('PII Redaction', () => {
  it('should redact email addresses', () => {
    const t = 'contact me at test@example.com'
    const r = redactPII(t)
    expect(r).toContain('[redacted-email]')
  })

  it('should redact phone numbers', () => {
    const t = 'call me at +385 91 123 4567'
    const r = redactPII(t)
    expect(r).toContain('[redacted-phone]')
  })
})
