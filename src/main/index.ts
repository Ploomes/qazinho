import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { CHANNELS } from '@/constants';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { ResourceCollector } from '@/main/classes/resources/ResourceCollector';
import { WINDOW } from '@/main/constants';
import { isInternalNavigation } from '@/main/library';

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL;
const RENDERER_FILE = join(__dirname, '../renderer/index.html');
const PRELOAD_FILE = join(__dirname, '../preload/index.js');

const agents = new AgentDetector();
const resources = new ResourceCollector();
const deviceTools = new DeviceToolDetector();

function createWindow(): void {
  const window = new BrowserWindow({
    ...WINDOW,
    show: false,
    title: 'gocrash',
    backgroundColor: '#0a0b0d',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: PRELOAD_FILE,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  window.once('ready-to-show', () => window.show());

  window.webContents.on('will-navigate', (event, target) => {
    if (!isInternalNavigation(window.webContents.getURL(), target))
      event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) void window.loadURL(DEV_SERVER_URL);
  else void window.loadFile(RENDERER_FILE);
}

void app.whenReady().then(() => {
  ipcMain.handle(CHANNELS.detectAgents, () => agents.detect());
  ipcMain.handle(CHANNELS.readResources, () => resources.snapshot());
  ipcMain.handle(CHANNELS.detectDeviceTools, () => deviceTools.detect());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS: an app stays in the dock with no window open.
  if (process.platform !== 'darwin') app.quit();
});
