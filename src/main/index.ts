import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, shell } from 'electron';
import { isInternalNavigation } from '@/main/library';

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL'];
const RENDERER_FILE = join(__dirname, '../renderer/index.html');

function createMainWindow(): void {
  const window = new BrowserWindow({
    title: 'gocrash',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  const appUrl = RENDERER_URL ?? pathToFileURL(RENDERER_FILE).href;

  window.once('ready-to-show', () => window.show());

  window.webContents.on('will-navigate', (event, url) => {
    if (!isInternalNavigation(appUrl, url)) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (RENDERER_URL) void window.loadURL(RENDERER_URL);
  else void window.loadFile(RENDERER_FILE);
}

void app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS an app stays in the dock with no window open, until the user quits it.
  if (process.platform !== 'darwin') app.quit();
});
