import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    name: 'smoke',
    include: ['smoke/**/*.test.ts'],
    environment: 'node',
    testTimeout: 300_000,
  },
});
