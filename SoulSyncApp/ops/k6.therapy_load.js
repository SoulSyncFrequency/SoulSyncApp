
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

const API = __ENV.API || 'http://localhost:3000';

export default function () {
  const res = http.post(`${API}/api/therapy/generate`, JSON.stringify({ text: "load test" }), {
    headers: { 'Content-Type':'application/json', 'x-api-key': __ENV.KEY || 'public' }
  });
  check(res, { 'status OK or limited': (r) => [200,429,503].includes(r.status) });
  sleep(1);
}
