import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@brand': fileURLToPath(new URL('./assets', import.meta.url)),
};

export default defineConfig({
  main: {
    resolve: { alias },
    define: { __QAZINHO_VERSION__: JSON.stringify(version) },
    build: { lib: { entry: 'src/main/index.ts' } },
  },
  preload: {
    resolve: { alias },
    build: { lib: { entry: 'electron/preload/index.ts' } },
  },
  renderer: {
    root: 'src',
    resolve: { alias },
    define: { __QAZINHO_VERSION__: JSON.stringify(version) },
    plugins: [react()],
    server: { fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
    build: {
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('./src/index.html', import.meta.url)),
          recorder: fileURLToPath(new URL('./src/recorder.html', import.meta.url)),
          island: fileURLToPath(new URL('./src/island.html', import.meta.url)),
        },
      },
    },
  },
});
