import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.K6_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const thresholds = {
  checks: 0.99,
  failedRequests: 0.01,
  p95DurationMs: 500,
};

export const options = {
  vus: Number(__ENV.K6_VUS || 10),
  duration: __ENV.K6_DURATION || '1m',
  thresholds: {
    checks: [`rate>${thresholds.checks}`],
    http_req_duration: [`p(95)<${thresholds.p95DurationMs}`],
    http_req_failed: [`rate<${thresholds.failedRequests}`],
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

function getMetricValues(data, metricName) {
  const metric = data.metrics[metricName];
  return metric ? metric.values || metric : {};
}

function getMetricValue(data, metricName, valueName) {
  const values = getMetricValues(data, metricName);
  const value = values[valueName] !== undefined ? values[valueName] : valueName === 'rate' ? values.value : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatNumber(value, digits = 2) {
  return value === null ? 'N/A' : value.toFixed(digits);
}

function formatPercent(value) {
  return value === null ? 'N/A' : `${formatNumber(value * 100)}%`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
}

function buildReport(data) {
  const checksRate = getMetricValue(data, 'checks', 'rate');
  const failedRate = getMetricValue(data, 'http_req_failed', 'rate');
  const p95Duration = getMetricValue(data, 'http_req_duration', 'p(95)');
  const averageDuration = getMetricValue(data, 'http_req_duration', 'avg');
  const requests = getMetricValue(data, 'http_reqs', 'count');
  const requestsPerSecond = getMetricValue(data, 'http_reqs', 'rate');
  const virtualUsers = getMetricValue(data, 'vus_max', 'value') ?? getMetricValue(data, 'vus', 'max');
  const rows = [
    {
      metric: 'HTTP checks passed',
      value: formatPercent(checksRate),
      target: `>${formatPercent(thresholds.checks)}`,
      passed: checksRate !== null && checksRate > thresholds.checks,
    },
    {
      metric: 'Failed requests',
      value: formatPercent(failedRate),
      target: `<${formatPercent(thresholds.failedRequests)}`,
      passed: failedRate !== null && failedRate < thresholds.failedRequests,
    },
    {
      metric: '95th percentile response time',
      value: p95Duration === null ? 'N/A' : `${formatNumber(p95Duration)} ms`,
      target: `<${thresholds.p95DurationMs} ms`,
      passed: p95Duration !== null && p95Duration < thresholds.p95DurationMs,
    },
  ];

  return {
    rows,
    checksRate,
    failedRate,
    p95Duration,
    averageDuration,
    requests,
    requestsPerSecond,
    virtualUsers,
    passed: rows.every((row) => row.passed),
  };
}

function toMarkdown(report) {
  const status = report.passed ? 'PASS' : 'FAIL';
  const rows = report.rows
    .map((row) => `| ${row.metric} | ${row.value} | ${row.target} | ${row.passed ? 'PASS' : 'FAIL'} |`)
    .join('\n');

  return [
    `## Backend load test (k6): ${status}`,
    '',
    '| Metric | Result | Target | Status |',
    '| --- | ---: | ---: | :---: |',
    rows,
    '',
    `Requests: ${formatNumber(report.requests, 0)} (${formatNumber(report.requestsPerSecond)} req/s) · ` +
      `Average response time: ${report.averageDuration === null ? 'N/A' : `${formatNumber(report.averageDuration)} ms`} · ` +
      `Peak virtual users: ${formatNumber(report.virtualUsers, 0)}`,
    '',
  ].join('\n');
}

function toHtml(report) {
  const status = report.passed ? 'Passed' : 'Failed';
  const rows = report.rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.metric)}</th><td>${escapeHtml(row.value)}</td>` +
        `<td>${escapeHtml(row.target)}</td><td class="${row.passed ? 'passed' : 'failed'}">${row.passed ? 'Pass' : 'Fail'}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Backend k6 load test</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; color: #172033; background: #f4f6fa; }
    body { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    header, section { background: white; border: 1px solid #dfe4ec; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    h1 { margin: 0 0 8px; font-size: 1.6rem; }
    .status { font-weight: 700; color: ${report.passed ? '#16794b' : '#b42318'}; }
    .stats { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 20px; }
    .stat strong { display: block; font-size: 1.35rem; }
    .stat span { color: #596579; font-size: .9rem; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e8ebf0; }
    td:last-child { font-weight: 700; }
    .passed { color: #16794b; } .failed { color: #b42318; }
    footer { color: #596579; font-size: .9rem; margin: 16px 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Backend load test</h1>
    <div>GET /v1/projects · <span class="status">${status}</span></div>
    <div class="stats">
      <div class="stat"><strong>${formatNumber(report.requests, 0)}</strong><span>Requests</span></div>
      <div class="stat"><strong>${formatNumber(report.requestsPerSecond)}</strong><span>Requests / second</span></div>
      <div class="stat"><strong>${report.p95Duration === null ? 'N/A' : `${formatNumber(report.p95Duration)} ms`}</strong><span>p95 response time</span></div>
      <div class="stat"><strong>${formatNumber(report.virtualUsers, 0)}</strong><span>Peak virtual users</span></div>
    </div>
  </header>
  <section>
    <h2>Thresholds</h2>
    <table>
      <thead><tr><th scope="col">Metric</th><th scope="col">Result</th><th scope="col">Target</th><th scope="col">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>
  <footer>Average response time: ${report.averageDuration === null ? 'N/A' : `${formatNumber(report.averageDuration)} ms`}. Generated by k6.</footer>
</body>
</html>`;
}

export function handleSummary(data) {
  const report = buildReport(data);
  return {
    'backend/k6/summary.html': toHtml(report),
    'backend/k6/summary.md': toMarkdown(report),
  };
}
