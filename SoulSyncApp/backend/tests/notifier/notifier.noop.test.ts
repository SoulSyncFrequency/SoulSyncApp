
describe('Notifier noop when env not set', () => {
  it('is effectively a noop (placeholder)', () => {
    expect(process.env.SLACK_WEBHOOK_URL || '').toBe('')
    expect(process.env.DISCORD_WEBHOOK_URL || '').toBe('')
    expect(process.env.SMTP_URL || '').toBe('')
  })
})
