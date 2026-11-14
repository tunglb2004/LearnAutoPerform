// config/settings.js
// Đây là nơi tập trung các con số thường cần thay đổi.

function readNumber(name, fallback, min, max, integer = false) {
  const raw = __ENV[name];
  const value = raw === undefined ? fallback : Number(raw);

  if (
    (raw !== undefined && raw.trim() === '') ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    throw new Error(
      `${name} phải là ${integer ? 'số nguyên' : 'số'} từ ${min} đến ${max}`,
    );
  }

  return value;
}

const profiles = {
  smoke:   { vus: 1,  duration: 10, think: 1 },
  load:    { vus: 10, duration: 60, think: 1 },
  arrival: { vus: 10, duration: 30, think: 0 },
  exact:   { vus: 1,  duration: 10, think: 0 },
};

const profileName = (__ENV.PROFILE ?? 'smoke').trim().toLowerCase();

if (!Object.prototype.hasOwnProperty.call(profiles, profileName)) {
  throw new Error('PROFILE phải là smoke, load, arrival hoặc exact');
}

const profile = profiles[profileName];
const baseUrl = (__ENV.BASE_URL ?? 'http://127.0.0.1:3000')
  .trim()
  .replace(/\/+$/, '');

// Kiểm tra sơ bộ; khi đổi môi trường vẫn phải xác nhận đúng host cần test.
if (!/^https?:\/\/[^\s]+$/.test(baseUrl)) {
  throw new Error('BASE_URL phải bắt đầu bằng http:// hoặc https://');
}

export const config = {
  profile: profileName,
  baseUrl,
  vus: readNumber('VUS', profile.vus, 1, 200, true),
  durationSeconds: readNumber('DURATION_SECONDS', profile.duration, 1, 3600, true),
  thinkSeconds: readNumber('THINK_SECONDS', profile.think, 0, 60),
  iterations: readNumber('ITERATIONS', 10, 1, 100000, true),
  maxDurationSeconds: readNumber('MAX_DURATION_SECONDS', 120, 1, 3600, true),
  rate: readNumber('RATE', 10, 1, 1000, true),
  preAllocatedVUs: readNumber('PRE_ALLOCATED_VUS', 10, 1, 200, true),
  maxVUs: readNumber('MAX_VUS', 30, 1, 200, true),
  requestTimeoutSeconds: readNumber('REQUEST_TIMEOUT_SECONDS', 10, 1, 120, true),
  p95Ms: readNumber('P95_MS', 500, 1, 60000),
  maxErrorRate: readNumber('MAX_ERROR_RATE', 0.01, 0, 1),
  minBusinessSuccessRate: readNumber('MIN_BUSINESS_SUCCESS_RATE', 0.99, 0, 1),
};

if (config.profile === 'exact' && config.vus > config.iterations) {
  throw new Error('Profile exact yêu cầu VUS không lớn hơn ITERATIONS');
}

if (config.profile === 'arrival') {
  if (config.maxVUs < config.preAllocatedVUs) {
    throw new Error('MAX_VUS phải lớn hơn hoặc bằng PRE_ALLOCATED_VUS');
  }
  if (config.thinkSeconds !== 0) {
    throw new Error('Profile arrival của ví dụ yêu cầu THINK_SECONDS=0');
  }
}

export function createOptions(c) {
  const common = {
    exec: 'readProduct',
    gracefulStop: `${c.requestTimeoutSeconds + 5}s`,
    tags: { workload: c.profile },
  };

  let scenario;

  if (c.profile === 'exact') {
    scenario = {
      ...common,
      executor: 'shared-iterations',
      vus: c.vus,
      iterations: c.iterations,
      maxDuration: `${c.maxDurationSeconds}s`,
    };
  } else if (c.profile === 'arrival') {
    scenario = {
      ...common,
      executor: 'constant-arrival-rate',
      rate: c.rate,
      timeUnit: '1s',
      duration: `${c.durationSeconds}s`,
      preAllocatedVUs: c.preAllocatedVUs,
      maxVUs: c.maxVUs,
    };
  } else {
    scenario = {
      ...common,
      executor: 'constant-vus',
      vus: c.vus,
      duration: `${c.durationSeconds}s`,
    };
  }

  const thresholds = {
    'http_reqs{endpoint:product_detail}': ['count>0'],
    'http_req_duration{endpoint:product_detail}': [`p(95)<${c.p95Ms}`],
    'http_req_failed{endpoint:product_detail}': [`rate<=${c.maxErrorRate}`],
    'business_success{endpoint:product_detail}': [
      `rate>=${c.minBusinessSuccessRate}`,
    ],
  };

  if (c.profile === 'arrival' || c.profile === 'exact') {
    thresholds.dropped_iterations = ['count==0'];
  }

  if (c.profile === 'exact') {
    // Đây là đếm request flow, KHÔNG khẳng định mọi request đều thành công.
    thresholds['http_reqs{endpoint:product_detail}'] = [
      `count==${c.iterations}`,
    ];
  }

  return {
    scenarios: { product_read: scenario },
    thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
  };
}
