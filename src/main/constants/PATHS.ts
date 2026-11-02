import { join } from 'node:path';
import { app } from 'electron';

export const PATHS = {
  devServer: process.env.ELECTRON_RENDERER_URL,
  renderer: join(__dirname, '../renderer/index.html'),
  preload: join(__dirname, '../preload/index.js'),
  recorder: join(__dirname, '../renderer/recorder.html'),
  island: join(__dirname, '../renderer/island.html'),
  icon: join(__dirname, '../../build/icon.png'),
  data: app.getPath('userData'),
  profiles: join(app.getPath('userData'), 'profiles'),
  integrations: join(app.getPath('userData'), 'integrations.bin'),
  pro: join(app.getPath('userData'), 'pro.bin'),
  proSync: join(app.getPath('userData'), 'pro-sync.json'),
  variables: join(app.getPath('userData'), 'variables.bin'),
  agentHome: join(app.getPath('userData'), 'agent'),
  code: join(app.getPath('userData'), 'code'),
  jira: join(app.getPath('userData'), 'jira'),
  builds: join(app.getPath('userData'), 'builds'),
  logs: join(app.getPath('userData'), 'logs'),
} as const;
