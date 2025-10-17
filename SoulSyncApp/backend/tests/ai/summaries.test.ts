import { generateSummary } from '../../src/workers/summaries'

describe('Summaries Worker', () => {
  it('should return summary', async () => {
    const s = await generateSummary('user1')
    expect(typeof s.summary).toBe('string')
  })
})
