import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // O Vitest enraíza uma config na própria pasta; as suítes ainda leem out/ a partir da
  // raiz do repositório.
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
