import { join } from 'node:path';
import { app } from 'electron';

/** Where the app loads from and where it keeps the QA's work. Dev serves the page over http. */
export const PATHS = {
  devServer: process.env.ELECTRON_RENDERER_URL,
  renderer: join(__dirname, '../renderer/index.html'),
  preload: join(__dirname, '../preload/index.js'),
  icon: join(__dirname, '../../build/icon.png'),
  data: app.getPath('userData'),
  profiles: join(app.getPath('userData'), 'profiles'),
} as const;
