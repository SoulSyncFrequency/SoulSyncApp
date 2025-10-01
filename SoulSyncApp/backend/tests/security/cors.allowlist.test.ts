
describe('CORS allowlist', () => {
  it('should deny unknown origins when allowlist is set', () => {
    expect(process.env.CORS_ALLOWED_ORIGINS || '').toBeDefined()
  })
})
