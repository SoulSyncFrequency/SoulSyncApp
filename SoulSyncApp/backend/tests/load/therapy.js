import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s'
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH = __ENV.AUTH || '';

export default function () {
  const headers = AUTH ? { Authorization: `Bearer ${AUTH}` } : undefined;
  const res = http.request('GET', `${BASE_URL}/api/therapy/ping`, null, { headers });
  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });
  sleep(1);
}
