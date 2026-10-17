import { join } from 'node:path';
import { app } from 'electron';

/** Where the app loads from and where it keeps the QA's work. Dev serves the page over http. */
export const PATHS = {
  devServer: process.env.ELECTRON_RENDERER_URL,
  renderer: join(__dirname, '../renderer/index.html'),
  preload: join(__dirname, '../preload/index.js'),
  icon: join(__dirname, '../../build/icon.png'),
  data: app.getPath('userData'),
  // Where the app kept the QA's work while it was still called gocrash.
  legacyData: join(app.getPath('appData'), 'gocrash'),
  profiles: join(app.getPath('userData'), 'profiles'),
  integrations: join(app.getPath('userData'), 'integrations.bin'),
} as const;
