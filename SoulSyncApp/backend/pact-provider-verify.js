// Verify Pact contracts produced by frontend
import path from 'path'
import { Verifier } from '@pact-foundation/pact'
import fetch from 'node-fetch'

async function verify(){
  const pactDir = path.resolve(process.cwd(), '../frontend/pacts')
  const baseUrl = process.env.PACT_PROVIDER_BASE_URL || 'http://localhost:5000'
  const verifier = new Verifier({
    providerBaseUrl: baseUrl,
    pactUrls: [path.join(pactDir, 'soulsync-frontend-soulsync-backend.json')],
    publishVerificationResult: false
  })
  console.log('[pact] verifying against', baseUrl)
  await verifier.verifyProvider()
  console.log('[pact] verification success')
}

verify().catch(e=>{ console.error(e); process.exit(1) })
