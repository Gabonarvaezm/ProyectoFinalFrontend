import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e-local', timeout: 90000, workers: 1,
  outputDir: 'test-results-local/run',
  reporter: [['list'], ['json', { outputFile: 'test-results-local/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4311', channel: 'msedge', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
