import { join } from 'node:path';
import { app } from 'electron';

export const PATHS = {
  devServer: process.env.ELECTRON_RENDERER_URL,
  renderer: join(__dirname, '../renderer/index.html'),
  preload: join(__dirname, '../preload/index.js'),
  recorder: join(__dirname, '../renderer/recorder.html'),
  icon: join(__dirname, '../../build/icon.png'),
  data: app.getPath('userData'),
  profiles: join(app.getPath('userData'), 'profiles'),
  integrations: join(app.getPath('userData'), 'integrations.bin'),
  variables: join(app.getPath('userData'), 'variables.bin'),
  agentHome: join(app.getPath('userData'), 'agent'),
  code: join(app.getPath('userData'), 'code'),
  jira: join(app.getPath('userData'), 'jira'),
  builds: join(app.getPath('userData'), 'builds'),
  suites: join(app.getPath('userData'), 'suites'),
  logs: join(app.getPath('userData'), 'logs'),
} as const;
