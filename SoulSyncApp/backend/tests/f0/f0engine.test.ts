import { describe, it, expect } from 'vitest'
import { computeF0 } from '../../src/services/F0Engine.v2'

describe('F0Engine.v2', ()=>{
  it('returns 0 when Safe below threshold', ()=>{
    const score = computeF0({ Sym:1, Pol:1, Bph:1, Emo:1, Coh:1, Frac:1, Conn:1, Chak:1, Info:1, Safe:0.2, disease_type:'psychological' } as any)
    expect(score).toBe(0)
  })
  it('produces score in (0,1]', ()=>{
    const score = computeF0({ Sym:0.8, Pol:0.7, Bph:0.9, Emo:0.6, Coh:0.7, Frac:0.5, Conn:0.6, Chak:0.7, Info:0.8, Safe:0.9, disease_type:'neurodegenerative' } as any)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(1)
  })
})
