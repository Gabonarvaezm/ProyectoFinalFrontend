import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 60000, workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4310', channel: 'msedge', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
