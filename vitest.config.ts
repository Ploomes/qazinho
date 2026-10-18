import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@brand': fileURLToPath(new URL('./assets', import.meta.url)),
    },
  },
  define: { __QAZINHO_VERSION__: JSON.stringify(version) },
  test: {
    name: 'unit',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.ts'],
    passWithNoTests: true,
  },
});
