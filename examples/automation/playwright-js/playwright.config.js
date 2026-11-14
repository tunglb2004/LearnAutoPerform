import { defineConfig, devices } from '@playwright/test';

function readString(name, fallback) {
  const value = (process.env[name] ?? fallback).trim();
  if (value === '') {
    throw new Error(`${name} không được để trống`);
  }
  return value;
}

function readInteger(name, fallback, min, max) {
  const raw = readString(name, String(fallback));
  if (!/^[0-9]+$/.test(raw)) {
    throw new Error(`${name} phải là số nguyên`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} phải từ ${min} đến ${max}`);
  }
  return value;
}

function readBoolean(name, fallback) {
  const raw = readString(name, String(fallback)).toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} chỉ nhận true hoặc false`);
}

const rawBaseURL = readString('BASE_URL', 'http://127.0.0.1:3000');
let parsedURL;
try {
  parsedURL = new URL(rawBaseURL);
} catch (error) {
  throw new Error('BASE_URL không phải URL hợp lệ', { cause: error });
}

if (
  !['http:', 'https:'].includes(parsedURL.protocol) ||
  parsedURL.username !== '' || parsedURL.password !== '' ||
  parsedURL.search !== '' || parsedURL.hash !== '' ||
  parsedURL.pathname !== '/'
) {
  throw new Error('BASE_URL cần là origin http(s), ví dụ http://127.0.0.1:3000');
}

const uiTimeoutMs = readInteger('UI_TIMEOUT_SECONDS', 10, 1, 120) * 1000;
const testTimeoutMs = readInteger('TEST_TIMEOUT_SECONDS', 30, 1, 600) * 1000;
const retries = readInteger('TEST_RETRIES', 0, 0, 2);
const workers = readInteger('WORKERS', 1, 1, 4);
const headless = readBoolean('HEADLESS', true);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: process.env.CI === 'true',
  retries,
  workers,
  timeout: testTimeoutMs,
  expect: { timeout: uiTimeoutMs },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: parsedURL.origin,
    headless,
    actionTimeout: uiTimeoutMs,
    navigationTimeout: uiTimeoutMs,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
