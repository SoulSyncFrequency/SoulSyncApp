import request from 'supertest'
import app from './app'

test('GET /ping returns pong', async () => {
  const res = await request(app).get('/ping')
  expect(res.status).toBe(200)
  expect(res.body.pong).toBe(true)
})
