import path from 'path'
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import fetch from 'node-fetch'

const provider = new PactV3({ consumer: 'soulsync-frontend', provider: 'soulsync-backend', dir: path.resolve(process.cwd(), 'pacts') })

describe('Pact — auth login', () => {
  it('logs in successfully', async () => {
    provider.given('user exists').uponReceiving('login').withRequest({
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@example.com', password: 'secret123' }
    }).willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: MatchersV3.like({ ok: true, token: 'TOKEN' })
    })

    await provider.executeTest(async mock => {
      const res = await fetch(`${mock.url}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:'test@example.com', password:'secret123' })})
      const json = await res.json()
      expect(json.ok).toBe(true)
      expect(json.token).toBeTruthy()
    })
  })
})
