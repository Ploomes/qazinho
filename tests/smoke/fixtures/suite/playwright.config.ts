import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  use: {
    baseURL: process.env.SHOP_URL,
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'leitura', grepInvert: /@altera-dados/ },
    { name: 'altera', grep: /@altera-dados/, workers: 1 },
  ],
});
