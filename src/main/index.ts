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
  SaveOutcome,
  WindowFit,
} from '@/shared/types';
import { writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  safeStorage,
  screen,
  shell,
} from 'electron';
import { Harness, McpHost } from '@/harness';
import {
  AgentDetector,
  AgentLogin,
  AgentMcp,
  AgentRunner,
  AppPeek,
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
import {
  FILE_FILTERS,
  PATHS,
  WINDOW,
  WINDOW_FITS,
  WINDOW_SHOW_FALLBACK_MS,
} from '@/main/constants';
import {
  agentFailure,
  bytesOfDataUrl,
  fileNameOf,
  fittedBounds,
  hydrateShellPath,
  imageExtensionOf,
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
const peek = new AppPeek({ folder: tmpdir() });

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
      text: '',
      usage: null,
      isError: true,
      answer: null,
      failure: { reason: 'agent-missing', agentId: ask.agentId },
    };
  }

  const chat = harness.chat({
    target: ask.target,
    viewport: ask.viewport,
    steps: ask.steps,
    references: ask.references,
    look: ask.target?.kind === 'web' ? await peek.look(ask.target.value) : null,
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

  return {
    ...turn,
    answer: turn.isError ? null : harness.readChat(turn.text),
    failure: agentFailure(turn),
  };
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

async function shotBytes(props: {
  file: string | null;
  src: string | null;
}): Promise<Buffer | null> {
  if (props.file !== null) return archive.readShotBytes(props.file);

  return props.src === null ? null : bytesOfDataUrl(props.src);
}

async function saveShot(props: {
  file: string | null;
  src: string | null;
  name: string;
}): Promise<SaveOutcome> {
  const bytes = await shotBytes(props);

  if (bytes === null) return 'failed';

  const extension = imageExtensionOf(bytes);
  const options = {
    defaultPath: join(app.getPath('downloads'), `${fileNameOf(props.name)}.${extension}`),
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
  };
  const [open] = BrowserWindow.getAllWindows();
  const picked = open
    ? await dialog.showSaveDialog(open, options)
    : await dialog.showSaveDialog(options);

  if (picked.canceled || picked.filePath === undefined) return 'cancelled';

  return writeFile(picked.filePath, bytes).then(
    () => 'saved' as const,
    () => 'failed' as const,
  );
}

function fitWindow(props: { window: BrowserWindow; fit: WindowFit }): void {
  const { window, fit } = props;
  const isVisible = window.isVisible();

  window.setBounds(
    fittedBounds({
      size: WINDOW_FITS[fit],
      area: screen.getDisplayMatching(window.getBounds()).workArea,
      current: isVisible ? window.getBounds() : null,
    }),
    isVisible,
  );

  if (!isVisible) window.show();
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

  window.once('ready-to-show', () => {
    setTimeout(() => {
      if (!window.isDestroyed() && !window.isVisible()) window.show();
    }, WINDOW_SHOW_FALLBACK_MS);
  });

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
  ipcMain.handle(
    CHANNELS.saveShot,
    (_event, props: { file: string | null; src: string | null; name: string }) =>
      saveShot(props),
  );
  ipcMain.handle(CHANNELS.pickFile, (_event, kind: PickKind) => pickFile(kind));
  ipcMain.handle(CHANNELS.fitWindow, (event, fit: WindowFit) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (window !== null) fitWindow({ window, fit });
  });
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

app.on('will-quit', (event) => {
  if (archive.isWriting()) {
    event.preventDefault();
    void archive.settle().finally(() => {
      app.quit();
    });

    return;
  }

  live.close();
  tools.close();
  mcp.close();
  login.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
