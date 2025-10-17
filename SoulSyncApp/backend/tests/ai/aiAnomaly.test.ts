import { aiAnomaly } from '../../src/middleware/aiAnomaly'

describe('AI Anomaly Middleware', () => {
  it('should pass normal traffic', async () => {
    const req: any = { ip: '1.2.3.4', path: '/ok', method: 'GET' }
    const res: any = {}
    let called = false
    await aiAnomaly(req, res, () => { called = true })
    expect(called).toBe(true)
  })
})
