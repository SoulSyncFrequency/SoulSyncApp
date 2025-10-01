import { generateRecommendations } from '../../src/workers/recommendations'

describe('Recommendations Worker', () => {
  it('should return items with vectors', async () => {
    const recs = await generateRecommendations('user1')
    expect(Array.isArray(recs)).toBe(true)
    expect(recs[0]).toHaveProperty('item')
    expect(recs[0]).toHaveProperty('vector')
  })
})
