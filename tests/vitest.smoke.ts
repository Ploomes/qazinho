import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vitest roots a config at its own folder; the suites still read out/ from the repository root.
  root: fileURLToPath(new URL('..', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  test: {
    name: 'smoke',
    include: ['tests/smoke/**/*.test.ts'],
    environment: 'node',
    testTimeout: 300_000,
  },
});
