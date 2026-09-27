import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4200',
    headless: true,
    channel: 'msedge',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
