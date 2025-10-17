import { ai } from '../../src/ai'

describe('Intent Detection', () => {
  it('should classify intent with default labels', async () => {
    const res = await ai.classify('reset password')
    expect(res).toHaveProperty('label')
  })
})
