import { describe, it, expect } from 'vitest'

// This is a placeholder unit test to ensure allow-list is enforced at code level (route-level validation is in integration)
describe('adminQueues allow-list', ()=>{
  it('has allow-list defined', ()=>{
    const txt = require('fs').readFileSync(require('path').resolve(process.cwd(), 'src/routes/adminQueues.ts'),'utf8')
    expect(txt.includes("const allowedQueues = new Set(['webhookQueue','emailQueue'])")).toBe(true)
  })
})
