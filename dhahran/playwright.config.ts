import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against a production build (`next build && next start`) wired to an
 * isolated test database. Synthetic data only; no outbound messages are sent.
 */
const PORT = 3100;
export const E2E_DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://reshape@127.0.0.1:54329/reshape_test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  timeout: 45_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/ar`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      APP_ENV: 'preview',
      LAUNCH_STAGE: 'preopening',
      SITE_URL: `http://localhost:${PORT}`,
      DATABASE_URL: E2E_DB_URL,
      LEAD_HASH_SECRET: 'e2e-test-secret-0000000000000000000000',
      PRIVACY_NOTICE_VERSION: 'draft-e2e',
      ANALYTICS_ENABLED: 'false',
    },
  },
});
