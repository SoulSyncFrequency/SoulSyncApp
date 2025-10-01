// k6 load: staged LOGIN -> ME -> REFRESH with think time
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || '30s', target: Number(__ENV.TARGET_VUS || 20) },
    { duration: __ENV.STEADY || '1m', target: Number(__ENV.TARGET_VUS || 20) },
    { duration: __ENV.RAMP_DOWN || '30s', target: 0 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],           // <5% error rate
    http_req_duration: ['p(95)<1000']         // p95 under 1s
  },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)']
}

const BASE = __ENV.BASE_URL || 'http://localhost:3000'

export function handleSummary(data) {
  const path = __ENV.K6_SUMMARY || 'k6-summary.json'
  return {
    [path]: JSON.stringify(data, null, 2),
    stdout: JSON.stringify({ metrics:Object.keys(data.metrics).length }, null, 2)
  }
}

export default function () {
  const email = `vu${__VU}-${Date.now()}@test.com`
  const password = 'pass1234'

  // register (best-effort)
  http.post(`${BASE}/auth/register`, JSON.stringify({ email, password }), { headers: { 'Content-Type':'application/json' } })

  // login
  const login = http.post(`${BASE}/auth/login`, JSON.stringify({ email, password }), { headers: { 'Content-Type':'application/json' } })
  check(login, { 'login 200': r => r.status === 200 })
  const access = login.json('accessToken')

  // me
  const me = http.get(`${BASE}/me`, { headers: { Authorization: `Bearer ${access}` } })
  check(me, { 'me 200': r => r.status === 200 })

  // csrf token
  const csrf = http.get(`${BASE}/csrf-token`)
  const csrfToken = csrf.json('csrfToken')

  // refresh attempt (guard tolerant)
  const refresh = http.post(`${BASE}/auth/refresh`, JSON.stringify({ refreshToken: '' }), {
    headers: { 'Content-Type':'application/json', 'x-csrf-token': csrfToken }
  })
  check(refresh, { 'refresh ok/guarded': r => [200,401,403].includes(r.status) })

  // think time 1–3s
  sleep(1 + Math.random()*2)
}
