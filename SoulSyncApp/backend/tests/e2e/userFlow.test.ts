import request from 'supertest'
import app from '../../src/app'

describe('E2E User Flow', () => {
  it('should login (mock), get recommendations, summary, and intent', async () => {
    // Mock login: here we just simulate an authenticated user (skip real JWT)
    const agent = request(app)

    // Recommendations
    const rec = await agent.get('/recommendations')
    expect(rec.status).toBe(200)
    expect(rec.body).toHaveProperty('recommendations')

    // Summary
    const sum = await agent.get('/me/summary')
    expect(sum.status).toBe(200)
    expect(sum.body).toHaveProperty('summary')

    // Intent detection
    const intent = await agent.post('/ai/intent').send({ text: 'need billing support' })
    expect(intent.status).toBe(200)
    expect(intent.body).toHaveProperty('label')
  })
})
