import request from 'supertest'
import app from '../../src/app'

describe('Recommendations & Summaries Integration', () => {
  it('GET /recommendations should return recs', async () => {
    const res = await request(app).get('/recommendations')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('recommendations')
  })

  it('GET /me/summary should return summary', async () => {
    const res = await request(app).get('/me/summary')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('summary')
  })
})
