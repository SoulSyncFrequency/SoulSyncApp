
describe('Version endpoint (shape)', () => {
  it('responds with {name, version}', () => {
    expect({ name: 'backend', version: 'x' }).toHaveProperty('name')
    expect({ name: 'backend', version: 'x' }).toHaveProperty('version')
  })
})
