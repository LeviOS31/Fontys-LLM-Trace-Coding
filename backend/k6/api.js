import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.K6_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

export const options = {
  vus: Number(__ENV.K6_VUS || 10),
  duration: __ENV.K6_DURATION || '1m',
  thresholds: {
    checks: ['rate>0.99'],
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/v1/projects`, {
    tags: { name: 'GET /v1/projects' },
  });

  check(response, {
    'GET /v1/projects returns HTTP 200': (result) => result.status === 200,
  });
}
