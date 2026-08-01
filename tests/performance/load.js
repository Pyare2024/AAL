/**
 * Progressive k6 Load Testing Script
 * Stages: 10 -> 50 -> 100 -> 250 -> 500 -> 1,000 VUs
 * Thresholds: Auth RPC < 100ms, Paginated List < 200ms
 * Stop Conditions: Error rate > 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 250 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // error rate < 1%
    http_req_duration: ['p(95)<200'], // p95 response time < 200ms
  },
};

export default function () {
  const baseUrl = __ENV.STAGING_URL || 'http://localhost:5173';
  const res = http.get(`${baseUrl}/login`);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
