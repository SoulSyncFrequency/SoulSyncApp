import { describe, it, expect } from 'vitest'
import { deterministicJobId } from '../src/queue/utils'

describe('deterministicJobId', () => {
  it('produces same id for same (kind,payload)', () => {
    const a = deterministicJobId('deliver', { x: 1, y: 'z' })
    const b = deterministicJobId('deliver', { y: 'z', x: 1 }) // different key order
    expect(a).toBe(b)
  })
  it('produces different id for different kind', () => {
    const a = deterministicJobId('deliver', { x: 1 })
    const b = deterministicJobId('email', { x: 1 })
    expect(a).not.toBe(b)
  })
})
