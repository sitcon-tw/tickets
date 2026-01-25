import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// 壓力測試：持續增加負載直到系統崩潰
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 2分鐘增加到 100 用戶
    { duration: '5m', target: 200 },   // 5分鐘增加到 200 用戶
    { duration: '2m', target: 300 },   // 2分鐘增加到 300 用戶
    { duration: '5m', target: 400 },   // 5分鐘增加到 400 用戶
    { duration: '2m', target: 0 },     // 降回 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.3'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/events`, null, { tags: { name: 'GetEvents' } }],
    ['GET', `${BASE_URL}/api/system/health`, null, { tags: { name: 'HealthCheck' } }],
  ]);

  responses.forEach((res) => {
    check(res, {
      '請求成功': (r) => r.status < 500,
    }) || errorRate.add(1);
  });

  sleep(0.5);
}
