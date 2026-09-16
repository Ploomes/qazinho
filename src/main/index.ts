import type { IAgentEvent, IAskAgent } from '@/types';
import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { CHANNELS } from '@/constants';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
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

function broadcast(event: IAgentEvent): void {
  for (const open of BrowserWindow.getAllWindows())
    open.webContents.send(CHANNELS.agentEvent, event);
}

const agentRunner = new AgentRunner(broadcast);

async function askAgent(ask: IAskAgent) {
  const found = (await agents.detect()).find(({ id }) => id === ask.agentId);

  if (!found?.path) {
    return {
      sessionId: ask.sessionId,
      text: `gocrash cannot find ${ask.agentId} on this machine. Install it, or pick another agent in Settings.`,
      usage: null,
      isError: true,
    };
  }

  return agentRunner.ask({ ...ask, command: found.path });
}

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
  ipcMain.handle(CHANNELS.askAgent, (_event, ask: IAskAgent) => askAgent(ask));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS: an app stays in the dock with no window open.
  if (process.platform !== 'darwin') app.quit();
});
