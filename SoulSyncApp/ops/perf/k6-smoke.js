// k6 smoke test for SoulSync
import http from 'k6/http'
import { sleep, check } from 'k6'

export const options = { vus: 5, duration: '30s' }

const BASE = __ENV.BASE_URL || 'http://localhost:8080'

export default function () {
  const r1 = http.get(`${BASE}/api/healthz`)
  check(r1, { 'health 200': (r) => r.status === 200 })

  const r2 = http.get(`${BASE}/api/version`)
  check(r2, { 'version 200': (r) => r.status === 200 })

  const r3 = http.get(`${BASE}/api/metrics`)
  check(r3, { 'metrics 200': (r) => r.status === 200 && r.body.includes('http_requests_total') })

  sleep(1)
}
