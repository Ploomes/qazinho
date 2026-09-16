import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  main: {
    resolve: { alias },
    build: { lib: { entry: 'src/main/index.ts' } },
  },
  preload: {
    resolve: { alias },
    build: { lib: { entry: 'electron/preload/index.ts' } },
  },
  renderer: {
    root: 'src',
    resolve: { alias },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: fileURLToPath(new URL('./src/index.html', import.meta.url)),
      },
    },
  },
});
