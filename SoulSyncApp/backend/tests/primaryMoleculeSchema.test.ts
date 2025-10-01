import { describe, it, expect } from 'vitest'
import { PrimaryMoleculeMetaSchema } from '../src/schemas/primaryMolecule'

describe('PrimaryMoleculeMetaSchema', () => {
  it('validates a proper object', () => {
    const obj = {
      value: 'C60',
      provenance: 'ai',
      note: 'valid',
      smiles: 'C60',
      description: 'Primary molecule: C60'
    }
    const res = PrimaryMoleculeMetaSchema.safeParse(obj)
    expect(res.success).toBe(true)
  })
  it('rejects missing fields', () => {
    const res = PrimaryMoleculeMetaSchema.safeParse({})
    expect(res.success).toBe(false)
  })
})
