import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
}

export default function () {
  let res = http.post('http://localhost:3000/ai/summarize', JSON.stringify({ text: 'Performance test text' }), {
    headers: { 'Content-Type': 'application/json' },
  })
  check(res, { 'status 200': (r) => r.status === 200 })
  sleep(1)
}
