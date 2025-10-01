import request from 'supertest'
import app from '../../src/app'

describe('AI Routes Integration', () => {
  it('POST /ai/summarize should return summary', async () => {
    const res = await request(app)
      .post('/ai/summarize')
      .send({ text: 'This is a long text that needs summarization.' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('summary')
  })

  it('POST /ai/classify should return label', async () => {
    const res = await request(app)
      .post('/ai/classify')
      .send({ text: 'billing issue', labels: ['billing','support'] })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('label')
  })

  it('POST /ai/intent should return intent label', async () => {
    const res = await request(app)
      .post('/ai/intent')
      .send({ text: 'panic attack help' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('label')
  })
})
