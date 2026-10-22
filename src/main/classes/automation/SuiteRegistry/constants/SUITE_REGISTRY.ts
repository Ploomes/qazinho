export const SUITE_REGISTRY = {
  file: 'registry.json',
  configs: [
    'playwright.config.ts',
    'playwright.config.mts',
    'playwright.config.cts',
    'playwright.config.js',
    'playwright.config.mjs',
    'playwright.config.cjs',
  ],
  runner: ['node_modules', '@playwright', 'test', 'package.json'],
  cli: 'cli.js',
  envExample: '.env.example',
  envFile: '.env',
} as const;
