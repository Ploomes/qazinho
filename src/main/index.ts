import type {
  AgentSignInProgress,
  IAgentEvent,
  IAskAgent,
  IChatTurn,
  IConnectIntegration,
  InstallableId,
  IntegrationId,
  IRunEvent,
  IMcpServerTarget,
  IMcpSignIn,
  ISavedWorkspace,
  ISetupEvent,
  IStartRun,
  IViewport,
  McpSignInProgress,
  PickKind,
} from '@/shared/types';
import { homedir } from 'node:os';
import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron';
import { Harness, McpHost } from '@/harness';
import {
  AgentDetector,
  AgentLogin,
  AgentMcp,
  AgentRunner,
  Archive,
  DeviceToolDetector,
  IntegrationVault,
  LiveStream,
  ProcessOwners,
  ResourceCollector,
  RunCoordinator,
  SetupInstaller,
} from '@/main/classes';
import { listAvds } from '@/main/classes/devices/AndroidDriver/library';
import { listSimulators } from '@/main/classes/devices/IosDriver/library';
import { FILE_FILTERS, PATHS, WINDOW } from '@/main/constants';
import {
  hydrateShellPath,
  isInternalNavigation,
  searchDirectories,
} from '@/main/library';
import { CHANNELS } from '@/shared/constants';

const agents = new AgentDetector();
const owners = new ProcessOwners();
const resources = new ResourceCollector({
  owners,
  profileRoot: PATHS.profiles,
});
const deviceTools = new DeviceToolDetector();
const archive = new Archive(PATHS.data);
const live = new LiveStream();
const tools = new McpHost();
const harness = new Harness();

function broadcast(props: {
  channel: string;
  event: IAgentEvent | IRunEvent | ISetupEvent | McpSignInProgress | AgentSignInProgress;
}): void {
  for (const open of BrowserWindow.getAllWindows())
    open.webContents.send(props.channel, props.event);
}

const installer = new SetupInstaller({
  onEvent: (event) => broadcast({ channel: CHANNELS.setupEvent, event }),
  directories: async () =>
    searchDirectories({
      appPath: process.env.PATH,
      shellPath: await hydrateShellPath(),
      home: homedir(),
    }),
});
const mcp = new AgentMcp({
  findAgent: (agentId) => findCommand(agentId),
  openUrl: (url) => shell.openExternal(url),
  openScript: async (file) => {
    await shell.openPath(file);
  },
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.mcpSignInEvent, event: progress }),
  folder: PATHS.agentHome,
});
const login = new AgentLogin({
  findAgent: (agentId) => findCommand(agentId),
  openUrl: (url) => shell.openExternal(url),
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.agentSignInEvent, event: progress }),
  folder: PATHS.agentHome,
});
const vault = new IntegrationVault({
  file: PATHS.integrations,
  cipher: {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (plain) => safeStorage.encryptString(plain),
    decrypt: (sealed) => safeStorage.decryptString(sealed),
  },
  fetcher: (url, init) => fetch(url, init),
});

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
  tools,
  harness,
  onEvent: (event) => broadcast({ channel: CHANNELS.runEvent, event }),
});

async function askAgent(ask: IAskAgent): Promise<IChatTurn> {
  const command = await findCommand(ask.agentId);

  if (!command) {
    return {
      sessionId: ask.sessionId,
      text: `QAzinho cannot find ${ask.agentId} on this machine. Install it, or pick another agent in Settings.`,
      usage: null,
      isError: true,
      answer: null,
    };
  }

  const chat = harness.chat({
    target: ask.target,
    steps: ask.steps,
    references: ask.references,
  });

  const turn = await agentRunner.ask({
    workspaceId: ask.workspaceId,
    agentId: ask.agentId,
    command,
    model: ask.model,
    sessionId: ask.sessionId,
    prompt: ask.text,
    schema: chat.schema,
    systemPrompt: chat.systemPrompt,
    allowedTools: chat.tools.allowedTools,
  });

  return { ...turn, answer: turn.isError ? null : harness.readChat(turn.text) };
}

async function checkMachine() {
  agents.forget();
  deviceTools.forget();

  return {
    agents: await agents.detect(),
    tools: deviceTools.detect(),
    managers: await installer.managers(),
  };
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
    title: 'QAzinho',
    backgroundColor: '#0e0e0e',
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
  if (!app.isPackaged) app.dock?.setIcon(PATHS.icon);

  await live.start();
  await tools.start();

  ipcMain.handle(CHANNELS.detectAgents, () => agents.detect());
  ipcMain.handle(CHANNELS.readResources, () => resources.snapshot());
  ipcMain.handle(CHANNELS.detectDeviceTools, () => deviceTools.detect());
  ipcMain.handle(CHANNELS.signInAgent, (_event, agentId: string) =>
    login.signIn(agentId),
  );
  ipcMain.handle(CHANNELS.cancelAgentSignIn, (_event, agentId: string) => {
    login.cancel(agentId);
  });
  ipcMain.handle(
    CHANNELS.sendAgentSignInCode,
    (_event, props: { agentId: string; code: string }) => {
      login.sendCode(props);
    },
  );
  ipcMain.handle(CHANNELS.askAgent, (_event, ask: IAskAgent) => askAgent(ask));
  ipcMain.handle(CHANNELS.startRun, (_event, run: IStartRun) => runs.start(run));
  ipcMain.handle(CHANNELS.stopRun, (_event, workspaceId: string) => {
    runs.stop(workspaceId);
  });
  ipcMain.handle(CHANNELS.runsInFlight, () => runs.inFlight());
  ipcMain.handle(
    CHANNELS.resizeDevice,
    (_event, props: { workspaceId: string; viewport: IViewport }) => runs.resize(props),
  );
  ipcMain.handle(
    CHANNELS.focusDevice,
    (_event, props: { workspaceId: string; isFocused: boolean }) => runs.focus(props),
  );
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
  ipcMain.handle(CHANNELS.checkMachine, () => checkMachine());
  ipcMain.handle(CHANNELS.installTool, (_event, item: InstallableId) =>
    installer.install(item),
  );
  ipcMain.handle(CHANNELS.listIntegrations, () => vault.list());
  ipcMain.handle(CHANNELS.connectIntegration, (_event, connecting: IConnectIntegration) =>
    vault.connect(connecting),
  );
  ipcMain.handle(CHANNELS.disconnectIntegration, (_event, id: IntegrationId) =>
    vault.disconnect(id),
  );
  ipcMain.handle(CHANNELS.listMcpServers, (_event, agentId: string) => mcp.list(agentId));
  ipcMain.handle(CHANNELS.connectMcpServer, (_event, signIn: IMcpSignIn) =>
    mcp.connect(signIn),
  );
  ipcMain.handle(CHANNELS.cancelMcpSignIn, (_event, target: IMcpServerTarget) => {
    mcp.cancel(target);
  });
  ipcMain.handle(CHANNELS.removeMcpServer, (_event, target: IMcpServerTarget) =>
    mcp.remove(target),
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  live.close();
  tools.close();
  mcp.close();
  login.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
