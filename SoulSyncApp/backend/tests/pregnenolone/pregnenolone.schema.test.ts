
import { PregnenolonePlanCreate, PregnenoloneDoseLog } from '../../src/schema/pregnenolone'

describe('Pregnenolone schema', () => {
  it('accepts basic plan', () => {
    const ok = PregnenolonePlanCreate.safeParse({ doseUnit:'mg', route:'oral' })
    expect(ok.success).toBe(true)
  })
  it('rejects negative dose', () => {
    const bad = PregnenoloneDoseLog.safeParse({ planId:'x', ts:new Date().toISOString(), amount:-1, unit:'mg', route:'oral' })
    expect(bad.success).toBe(false)
  })
})
