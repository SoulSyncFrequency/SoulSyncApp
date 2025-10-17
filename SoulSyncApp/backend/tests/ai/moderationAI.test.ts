import { aiModeration } from '../../src/middleware/moderationAI'

describe('AI Moderation Middleware', () => {
  it('should pass allowed content', async () => {
    const req: any = { body: { text: 'hello' } }
    const res: any = {}
    let called = false
    await aiModeration(req, res, () => { called = true })
    expect(called).toBe(true)
  })

  it('should block disallowed content (mock)', async () => {
    const req: any = { body: { text: 'blocked' } }
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    // simulate provider moderate override
    const orig = require('../../src/ai').ai
    ;(orig.moderate as any) = async () => ({ allowed: false })
    await aiModeration(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
