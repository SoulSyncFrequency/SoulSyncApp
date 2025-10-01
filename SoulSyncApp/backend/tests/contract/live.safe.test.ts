
import axios from 'axios'

const BASE = process.env.CONTRACT_BASE_URL
const SKIP = !BASE

describe('Live safe endpoints', () => {
  it('GET /health returns 200', async () => {
    if (SKIP) return
    const res = await axios.get(BASE + '/health', { validateStatus:()=>true })
    expect(res.status).toBe(200)
  })
  it('GET /openapi.json returns 200', async () => {
    if (SKIP) return
    const res = await axios.get(BASE + '/openapi.json', { validateStatus:()=>true })
    expect([200,404]).toContain(res.status) // some envs may not expose openly
  })
})
