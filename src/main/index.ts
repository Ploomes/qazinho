import type {
  IAgentEvent,
  IAskAgent,
  IRunEvent,
  ISavedWorkspace,
  IStartRun,
  PickKind,
} from '@/types';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { CHANNELS } from '@/constants';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { listAvds } from '@/main/classes/devices/AndroidDriver/library';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { listSimulators } from '@/main/classes/devices/IosDriver/library';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { ResourceCollector } from '@/main/classes/resources/ResourceCollector';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Archive } from '@/main/classes/storage/Archive';
import { FILE_FILTERS, PATHS, WINDOW } from '@/main/constants';
import { isInternalNavigation } from '@/main/library';

const agents = new AgentDetector();
const owners = new ProcessOwners();
const resources = new ResourceCollector({
  owners,
  profileRoot: PATHS.profiles,
});
const deviceTools = new DeviceToolDetector();
const archive = new Archive(PATHS.data);
const live = new LiveStream();

function broadcast(props: { channel: string; event: IAgentEvent | IRunEvent }): void {
  for (const open of BrowserWindow.getAllWindows())
    open.webContents.send(props.channel, props.event);
}

const agentRunner = new AgentRunner({
  owners,
  onEvent: (event) => broadcast({ channel: CHANNELS.agentEvent, event }),
});

async function findCommand(agentId: string): Promise<string | null> {
  return (await agents.detect()).find(({ id }) => id === agentId)?.path ?? null;
}

async function findAndroid() {
  const sdkRoot = deviceTools.detect().androidSdk.path;

  if (sdkRoot === null) return null;

  const avd = (await listAvds(sdkRoot))[0];

  return avd === undefined ? null : { sdkRoot, avd };
}

async function findIos() {
  const idb = deviceTools.detect().idb.path;

  if (idb === null) return null;

  const udid = (await listSimulators())[0];

  return udid === undefined ? null : { idb, udid };
}

const runs = new RunCoordinator({
  runner: agentRunner,
  findCommand,
  findAndroid,
  findIos,
  dataRoot: PATHS.data,
  live,
  onEvent: (event) => broadcast({ channel: CHANNELS.runEvent, event }),
});

async function askAgent(ask: IAskAgent) {
  const command = await findCommand(ask.agentId);

  if (!command) {
    return {
      sessionId: ask.sessionId,
      text: `gocrash cannot find ${ask.agentId} on this machine. Install it, or pick another agent in Settings.`,
      usage: null,
      isError: true,
    };
  }

  return agentRunner.ask({ ...ask, command });
}

async function pickFile(kind: PickKind) {
  const [open] = BrowserWindow.getAllWindows();
  const filters = [FILE_FILTERS[kind]];

  const picked = open
    ? await dialog.showOpenDialog(open, { properties: ['openFile'], filters })
    : await dialog.showOpenDialog({ properties: ['openFile'], filters });

  return picked.canceled ? null : (picked.filePaths[0] ?? null);
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
      preload: PATHS.preload,
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

  if (PATHS.devServer) void window.loadURL(PATHS.devServer);
  else void window.loadFile(PATHS.renderer);
}

void app.whenReady().then(async () => {
  await live.start();

  ipcMain.handle(CHANNELS.detectAgents, () => agents.detect());
  ipcMain.handle(CHANNELS.readResources, () => resources.snapshot());
  ipcMain.handle(CHANNELS.detectDeviceTools, () => deviceTools.detect());
  ipcMain.handle(CHANNELS.askAgent, (_event, ask: IAskAgent) => askAgent(ask));
  ipcMain.handle(CHANNELS.startRun, (_event, run: IStartRun) => runs.start(run));
  ipcMain.handle(CHANNELS.stopRun, (_event, workspaceId: string) => {
    runs.stop(workspaceId);
  });
  ipcMain.handle(
    CHANNELS.pauseRun,
    (_event, props: { workspaceId: string; isPaused: boolean }) => {
      runs.setPaused(props);
    },
  );
  ipcMain.handle(CHANNELS.readState, () => archive.read());
  ipcMain.handle(CHANNELS.saveProjects, (_event, json: string) =>
    archive.saveProjects(json),
  );
  ipcMain.handle(CHANNELS.saveWorkspace, (_event, saved: ISavedWorkspace) =>
    archive.saveWorkspace(saved),
  );
  ipcMain.handle(CHANNELS.removeWorkspace, (_event, workspaceId: string) =>
    archive.removeWorkspace(workspaceId),
  );
  ipcMain.handle(CHANNELS.readShot, (_event, file: string) => archive.readShot(file));
  ipcMain.handle(CHANNELS.pickFile, (_event, kind: PickKind) => pickFile(kind));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  live.close();
});

app.on('window-all-closed', () => {
  // macOS: an app stays in the dock with no window open.
  if (process.platform !== 'darwin') app.quit();
});
