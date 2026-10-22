import type { AppLook } from '@/harness';
import type {
  AgentSignInProgress,
  GithubSignInProgress,
  IAgentEvent,
  IAgentTurn,
  IAppToolAnswer,
  IApplyVariables,
  IAskAgent,
  IAssistantAsk,
  IBuildEvent,
  IChatTurn,
  ICodeCopy,
  IConnectIntegration,
  IExportCode,
  InstallableId,
  IntegrationId,
  IRunEndNotice,
  IRunEvent,
  IRunRef,
  IRepositoryRef,
  IMcpServerTarget,
  IMcpSignIn,
  ISavedWorkspace,
  ISetupEvent,
  IStartBuild,
  IStartRun,
  IStartSuiteRun,
  IViewport,
  McpSignInProgress,
  PickKind,
  SaveOutcome,
  SuiteEvent,
  SuitePick,
  WindowFit,
} from '@/shared/types';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { delimiter, extname, join } from 'node:path';
import { promisify } from 'node:util';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeImage,
  safeStorage,
  screen,
  shell,
} from 'electron';
import { Harness, McpHost } from '@/harness';
import {
  AgentDetector,
  AndroidDriver,
  AgentLogin,
  AgentMcp,
  AgentRunner,
  AppBridge,
  AppBuilder,
  AppPeek,
  Archive,
  AssistantAgent,
  CodeCopies,
  CodeExport,
  DeviceToolDetector,
  GitCli,
  GithubCli,
  GithubRepos,
  IntegrationVault,
  IosDriver,
  LiveStream,
  PhonePeek,
  ProcessOwners,
  ResourceCollector,
  RunCoordinator,
  ReplayServer,
  RunAlerts,
  RunRecorder,
  SetupInstaller,
  SuiteRegistry,
  SuiteRunner,
  UsageReader,
  VariableVault,
} from '@/main/classes';
import { APP_BUILDER } from '@/main/classes/builds/AppBuilder/constants';
import { buildIdOf } from '@/main/classes/builds/AppBuilder/library';
import {
  listAvds,
  newestBuildTools,
  packageOfApk,
} from '@/main/classes/devices/AndroidDriver/library';
import { bundleOfPlist, listSimulators } from '@/main/classes/devices/IosDriver/library';
import {
  ASSISTANT,
  FILE_FILTERS,
  PATHS,
  SAVED_VIDEO,
  WINDOW,
  WINDOW_FITS,
  WINDOW_SHOW_FALLBACK_MS,
} from '@/main/constants';
import {
  agentFailure,
  bytesOfDataUrl,
  fileNameOf,
  findExistingPath,
  findOnPath,
  fittedBounds,
  hydrateShellPath,
  imageExtensionOf,
  isInternalNavigation,
  isLostSession,
  isSealable,
  searchDirectories,
} from '@/main/library';
import { ASSISTANT_WAIT, CHANNELS } from '@/shared/constants';

const agents = new AgentDetector();
const owners = new ProcessOwners();
const resources = new ResourceCollector({
  owners,
  profileRoot: PATHS.profiles,
});
const deviceTools = new DeviceToolDetector();
const archive = new Archive(PATHS.data);
const live = new LiveStream();
const replays = new ReplayServer({ dataRoot: PATHS.data, suitesRoot: PATHS.suites });
const tools = new McpHost();
const harness = new Harness();
const peek = new AppPeek({ folder: tmpdir() });

const recorder = new RunRecorder({
  dataRoot: PATHS.data,
  preload: PATHS.preload,
  page: PATHS.devServer
    ? { url: `${PATHS.devServer}/recorder.html` }
    : { file: PATHS.recorder },
});

function appWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter((open) => !recorder.owns(open));
}

const alerts = new RunAlerts((run) => {
  const [open] = appWindows();

  if (!open) return;

  if (open.isMinimized()) open.restore();

  open.show();
  open.focus();
  open.webContents.send(CHANNELS.openRun, run);
});

function broadcast(props: {
  channel: string;
  event:
    | IAgentEvent
    | IRunEvent
    | ISetupEvent
    | McpSignInProgress
    | AgentSignInProgress
    | GithubSignInProgress
    | IBuildEvent
    | SuiteEvent;
}): void {
  for (const open of appWindows()) open.webContents.send(props.channel, props.event);
}

async function commandDirectories(): Promise<string[]> {
  return searchDirectories({
    appPath: process.env.PATH,
    shellPath: await hydrateShellPath(),
    home: homedir(),
  });
}

const installer = new SetupInstaller({
  onEvent: (event) => broadcast({ channel: CHANNELS.setupEvent, event }),
  directories: commandDirectories,
});
const github = new GithubCli({
  directories: commandDirectories,
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.githubSignInEvent, event: progress }),
});
const repos = new GithubRepos({ github });
const codeCopies = new CodeCopies({ github, root: PATHS.code });
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
const usageReader = new UsageReader({
  findAgent: (agentId) => findCommand(agentId),
  folder: PATHS.agentHome,
  exec: async ({ command, args, cwd, timeoutMs }) => {
    await mkdir(cwd, { recursive: true });

    const { stdout } = await promisify(execFile)(command, [...args], {
      cwd,
      timeout: timeoutMs,
    });

    return stdout;
  },
});
const keychain = {
  isAvailable: () =>
    isSealable({
      platform: process.platform,
      isAvailable: safeStorage.isEncryptionAvailable(),
      store:
        process.platform === 'linux' ? safeStorage.getSelectedStorageBackend() : null,
    }),
  encrypt: (plain: string) => safeStorage.encryptString(plain),
  decrypt: (sealed: Buffer) => safeStorage.decryptString(sealed),
};
const vault = new IntegrationVault({
  file: PATHS.integrations,
  cipher: keychain,
  fetcher: (url, init) => fetch(url, init),
  github: () => github.status(),
});
const variables = new VariableVault({ file: PATHS.variables, cipher: keychain });
const git = new GitCli({ directories: commandDirectories });
const suites = new SuiteRegistry({ root: PATHS.suites, git });
const suiteRunner = new SuiteRunner({
  registry: suites,
  node: async () =>
    findOnPath({ command: 'node', directories: await commandDirectories() }),
  env: suiteEnvOf,
  root: PATHS.suites,
  urlOf: (file) => replays.suiteFileUrl(file),
  onEvent: (event) => broadcast({ channel: CHANNELS.suiteEvent, event }),
});

const agentRunner = new AgentRunner({
  owners,
  folder: PATHS.agentHome,
  onEvent: (event) => {
    const buildId = buildIdOf(event.workspaceId);

    if (buildId !== null) {
      if (event.kind === 'text' || event.kind === 'action')
        builder.hear({ buildId, text: event.text });

      return;
    }

    broadcast({
      channel:
        event.workspaceId === ASSISTANT.scope
          ? CHANNELS.assistantEvent
          : CHANNELS.agentEvent,
      event,
    });
  },
});

const builder = new AppBuilder({
  github,
  runner: agentRunner,
  harness,
  root: PATHS.builds,
  findCommand,
  machine: async () => {
    const found = deviceTools.detect();

    return {
      androidSdk: found.androidSdk.path,
      javaHome: findExistingPath([process.env.JAVA_HOME, ...APP_BUILDER.javaHomes]),
      hasXcode: found.xcode.isFound,
      path: (await commandDirectories()).join(':'),
    };
  },
  readPlist: (file) =>
    new Promise((settle) => {
      execFile('plutil', ['-convert', 'json', '-o', '-', file], (error, stdout) => {
        settle(error === null ? stdout : null);
      });
    }),
  onEvent: (event) => {
    broadcast({ channel: CHANNELS.buildEvent, event });
  },
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

const phonePeek = new PhonePeek({
  openDevice: async (target) => {
    if (target.kind === 'android') {
      const android = await findAndroid();

      return android === null
        ? null
        : new AndroidDriver({ ...android, apk: target.value });
    }

    const ios = await findIos();

    return ios === null ? null : new IosDriver({ ...ios, app: target.value });
  },
  isBusy: (kind) => runs.inFlight().some(({ targetKind }) => targetKind === kind),
});
const codeExport = new CodeExport({
  dataRoot: PATHS.data,
  chooseFolder: async () => {
    const [open] = appWindows();
    const options = {
      properties: ['openDirectory' as const, 'createDirectory' as const],
      defaultPath: app.getPath('downloads'),
    };
    const picked = open
      ? await dialog.showOpenDialog(open, options)
      : await dialog.showOpenDialog(options);

    return picked.canceled ? null : (picked.filePaths[0] ?? null);
  },
  appIdOf: async (target) => {
    if (target.kind === 'ios') {
      const printed = await promisify(execFile)('plutil', [
        '-extract',
        'CFBundleIdentifier',
        'raw',
        join(target.value, 'Info.plist'),
      ]).catch(() => null);

      return printed === null ? null : bundleOfPlist(printed.stdout) || null;
    }

    const sdkRoot = deviceTools.detect().androidSdk.path;
    const tools =
      sdkRoot === null
        ? null
        : newestBuildTools(await readdir(join(sdkRoot, 'build-tools')).catch(() => []));

    if (sdkRoot === null || tools === null) return null;

    const dumped = await promisify(execFile)(
      join(sdkRoot, 'build-tools', tools, 'aapt2'),
      ['dump', 'packagename', target.value],
    ).catch(() => null);

    return dumped === null ? null : packageOfApk(dumped.stdout) || null;
  },
});
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
  recorder,
  variablesOf: (projectId) => variables.valuesOf(projectId),
  shrink: ({ image, width, height, quality }) =>
    nativeImage
      .createFromBuffer(image)
      .resize({ width, height, quality: 'best' })
      .toJPEG(quality),
});

const bridge = new AppBridge({
  timeoutMs: ASSISTANT_WAIT.toolMs,
  send: (request) => {
    const [open] = appWindows();

    if (!open) return false;

    open.webContents.send(CHANNELS.appToolCall, request);

    return true;
  },
});

const assistant = new AssistantAgent({
  runner: agentRunner,
  tools,
  harness,
  bridge,
  findCommand,
  kindOf: (path) =>
    stat(path).then(
      (found) => (found.isDirectory() ? 'directory' : found.isFile() ? 'file' : null),
      () => null,
    ),
  home: homedir(),
});

const toldChats = new Map<string, Record<string, string>>();
const askingChats = new Set<string>();
const stoppedChats = new Set<string>();

async function askOnce(props: {
  ask: IAskAgent;
  command: string;
  sessionId: string | null;
  look: AppLook | null;
  code: ICodeCopy | null;
}): Promise<{ turn: IAgentTurn; told: Record<string, string> }> {
  const { ask, command, sessionId, look, code } = props;
  const chat = harness.chat({
    text: ask.text,
    told: (sessionId === null ? undefined : toldChats.get(sessionId)) ?? {},
    target: ask.target,
    viewport: ask.viewport,
    steps: ask.steps,
    references: ask.references,
    runs: ask.runs,
    look,
    code,
    variables: ask.variables,
  });
  const turn = await agentRunner.ask({
    workspaceId: ask.workspaceId,
    agentId: ask.agentId,
    command,
    model: ask.model,
    sessionId,
    prompt: chat.prompt,
    schema: chat.schema,
    systemPrompt: chat.systemPrompt,
    allowedTools: chat.tools.allowedTools,
    readDirs: chat.readDirs,
  });

  return { turn, told: chat.told };
}

async function askAgent(ask: IAskAgent): Promise<IChatTurn> {
  const command = await findCommand(ask.agentId);
  const unanswered = {
    sessionId: ask.sessionId,
    text: '',
    usage: null,
    costUsd: null,
    isError: true,
    answer: null,
    code: null,
  };

  if (!command)
    return {
      ...unanswered,
      failure: { reason: 'agent-missing', agentId: ask.agentId },
    };

  askingChats.add(ask.workspaceId);

  const phone =
    ask.target !== null && ask.target.kind !== 'web' && ask.steps.length === 0
      ? { kind: ask.target.kind, value: ask.target.value }
      : null;

  if (phone !== null && !phonePeek.isKept(phone))
    broadcast({
      channel: CHANNELS.agentEvent,
      event: { kind: 'look', workspaceId: ask.workspaceId, device: phone.kind },
    });

  try {
    const [look, prepared] = await Promise.all([
      ask.target?.kind === 'web'
        ? peek.look(ask.target.value)
        : phone === null
          ? Promise.resolve(null)
          : phonePeek.look(phone),
      ask.code === null
        ? Promise.resolve(null)
        : codeCopies.prepare({
            workspaceId: ask.workspaceId,
            code: ask.code,
            onStep: ({ at, bytes }) => {
              broadcast({
                channel: CHANNELS.agentEvent,
                event: { kind: 'code', workspaceId: ask.workspaceId, step: at, bytes },
              });
            },
          }),
    ]);

    if (stoppedChats.has(ask.workspaceId)) {
      if (prepared !== null) await codeCopies.release(ask.workspaceId);

      return { ...unanswered, failure: { reason: 'stopped' } };
    }

    if (prepared !== null && !prepared.isReady)
      return {
        ...unanswered,
        failure: { reason: 'code', failure: prepared.failure, said: prepared.said },
      };

    const code = codeCopies.copyOf(ask.workspaceId);
    const first = await askOnce({ ask, command, sessionId: ask.sessionId, look, code });
    const isLost =
      first.turn.isError &&
      ask.sessionId !== null &&
      !stoppedChats.has(ask.workspaceId) &&
      isLostSession(first.turn.text);
    const { turn, told } = isLost
      ? await askOnce({ ask, command, sessionId: null, look, code })
      : first;

    if (stoppedChats.has(ask.workspaceId))
      return {
        ...turn,
        isError: true,
        answer: null,
        failure: { reason: 'stopped' },
        code: null,
      };

    if (!turn.isError && turn.sessionId !== null) toldChats.set(turn.sessionId, told);

    const answer = turn.isError ? null : harness.readChat(turn.text);

    if (answer?.plan && code !== null) await codeCopies.release(ask.workspaceId);

    return {
      ...turn,
      answer,
      failure: agentFailure(turn),
      code:
        code === null
          ? null
          : {
              repository: code.repository,
              branch: code.branch,
              base: code.base,
              commit: code.commit,
            },
    };
  } finally {
    askingChats.delete(ask.workspaceId);
    stoppedChats.delete(ask.workspaceId);
  }
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

  if (props.src === null) return null;

  const served = replays.suiteFileOfUrl(props.src);

  return served === null ? bytesOfDataUrl(props.src) : readFile(served).catch(() => null);
}

async function saveReplay(props: IRunRef & { name: string }): Promise<SaveOutcome> {
  const file = await replays.fileOf(props);

  if (file === null) return 'failed';

  const extension = extname(file).slice(1);
  const options = {
    defaultPath: join(app.getPath('downloads'), `${fileNameOf(props.name)}.${extension}`),
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
  };
  const [open] = appWindows();
  const picked = open
    ? await dialog.showSaveDialog(open, options)
    : await dialog.showSaveDialog(options);

  if (picked.canceled || picked.filePath === undefined) return 'cancelled';

  return copyFile(file, picked.filePath).then(
    () => 'saved' as const,
    () => 'failed' as const,
  );
}

async function saveVideo(props: {
  name: string;
  data: Uint8Array;
}): Promise<SaveOutcome> {
  const extension = SAVED_VIDEO.extension;
  const options = {
    defaultPath: join(app.getPath('downloads'), `${fileNameOf(props.name)}.${extension}`),
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
  };
  const [open] = appWindows();
  const picked = open
    ? await dialog.showSaveDialog(open, options)
    : await dialog.showSaveDialog(options);

  if (picked.canceled || picked.filePath === undefined) return 'cancelled';

  return writeFile(picked.filePath, props.data).then(
    () => 'saved' as const,
    () => 'failed' as const,
  );
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
  const [open] = appWindows();
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

async function suiteEnvOf(projectId: string): Promise<Record<string, string>> {
  const values = await variables.valuesOf(projectId).catch(() => []);

  return {
    PATH: (await commandDirectories()).join(delimiter),
    ...Object.fromEntries(values.map(({ name, value }) => [name, value])),
  };
}

async function pickSuite(projectId: string): Promise<SuitePick> {
  const [open] = appWindows();
  const picked = open
    ? await dialog.showOpenDialog(open, { properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ properties: ['openDirectory'] });
  const [path] = picked.filePaths;

  if (picked.canceled || path === undefined) return { kind: 'cancelled' };

  return suites.connect({ projectId, path });
}

async function pickFile(kind: PickKind) {
  const [open] = appWindows();
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

  window.on('focus', () => {
    alerts.seen();
  });

  window.webContents.on('did-finish-load', () => {
    bridge.dropAll();
  });

  window.on('closed', () => {
    bridge.dropAll();
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
  await replays.start();
  await tools.start();
  void codeCopies.sweep();
  void builder.sweep();

  ipcMain.handle(CHANNELS.detectAgents, () => agents.detect());
  ipcMain.handle(CHANNELS.readResources, () => resources.snapshot());
  ipcMain.handle(CHANNELS.detectDeviceTools, () => deviceTools.detect());
  ipcMain.handle(CHANNELS.signInAgent, (_event, agentId: string) =>
    login.signIn(agentId),
  );
  ipcMain.handle(CHANNELS.cancelAgentSignIn, (_event, agentId: string) => {
    login.cancel(agentId);
  });
  ipcMain.handle(CHANNELS.readAgentLimits, (_event, agentId: string) =>
    usageReader.read(agentId),
  );
  ipcMain.handle(CHANNELS.stopAgent, (_event, workspaceId: string) => {
    if (!askingChats.has(workspaceId)) return;

    stoppedChats.add(workspaceId);
    agentRunner.cancel(workspaceId);
  });
  ipcMain.handle(
    CHANNELS.sendAgentSignInCode,
    (_event, props: { agentId: string; code: string }) => {
      login.sendCode(props);
    },
  );
  ipcMain.handle(CHANNELS.askAgent, (_event, ask: IAskAgent) => askAgent(ask));
  ipcMain.handle(CHANNELS.startRun, (_event, run: IStartRun) => runs.start(run));
  ipcMain.handle(CHANNELS.exportCode, (_event, request: IExportCode) =>
    codeExport.export(request),
  );
  ipcMain.handle(CHANNELS.replayUrl, (_event, run: IRunRef) => replays.urlFor(run));
  ipcMain.on(CHANNELS.alertRunEnded, (event, notice: IRunEndNotice) => {
    alerts.alert({
      notice,
      isAway: !(BrowserWindow.fromWebContents(event.sender)?.isFocused() ?? false),
    });
  });
  ipcMain.handle(CHANNELS.runNetwork, (_event, run: IRunRef) => archive.readNetwork(run));
  ipcMain.handle(CHANNELS.saveReplay, (_event, props: IRunRef & { name: string }) =>
    saveReplay(props),
  );
  ipcMain.handle(CHANNELS.replayVideo, (_event, run: IRunRef) => replays.videoOf(run));
  ipcMain.handle(
    CHANNELS.saveVideo,
    (_event, props: { name: string; data: Uint8Array }) => saveVideo(props),
  );
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
  ipcMain.handle(CHANNELS.removeWorkspace, async (_event, workspaceId: string) => {
    await codeCopies.release(workspaceId);
    await archive.removeWorkspace(workspaceId);
  });
  ipcMain.handle(CHANNELS.readShot, (_event, file: string) => archive.readShot(file));
  ipcMain.handle(
    CHANNELS.saveShot,
    (_event, props: { file: string | null; src: string | null; name: string }) =>
      saveShot(props),
  );
  ipcMain.handle(CHANNELS.pickFile, (_event, kind: PickKind) => pickFile(kind));
  ipcMain.handle(CHANNELS.pickSuite, (_event, projectId: string) => pickSuite(projectId));
  ipcMain.handle(CHANNELS.suiteOf, (_event, projectId: string) =>
    suites.suiteOf(projectId),
  );
  ipcMain.handle(CHANNELS.forgetSuite, (_event, projectId: string) =>
    suites.forget(projectId),
  );
  ipcMain.handle(CHANNELS.listSuite, (_event, projectId: string) =>
    suiteRunner.list(projectId),
  );
  ipcMain.handle(CHANNELS.runSuite, (_event, start: IStartSuiteRun) => {
    void suiteRunner.run(start);
  });
  ipcMain.handle(CHANNELS.stopSuite, (_event, projectId: string) => {
    suiteRunner.stop(projectId);
  });
  ipcMain.handle(CHANNELS.suiteRuns, (_event, projectId: string) =>
    suiteRunner.runs(projectId),
  );
  ipcMain.handle(
    CHANNELS.openSuiteTrace,
    (_event, trace: { projectId: string; runId: string; file: string }) =>
      suiteRunner.openTrace(trace),
  );
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
  ipcMain.handle(CHANNELS.listVariables, () => variables.list());
  ipcMain.handle(CHANNELS.applyVariables, (_event, apply: IApplyVariables) =>
    variables.apply(apply),
  );
  ipcMain.handle(CHANNELS.forgetVariables, (_event, projectId: string) =>
    variables.forget(projectId),
  );
  ipcMain.handle(CHANNELS.githubStatus, () => github.status());
  ipcMain.handle(CHANNELS.signInGithub, () => github.signIn());
  ipcMain.handle(CHANNELS.cancelGithubSignIn, () => {
    github.cancelSignIn();
  });
  ipcMain.handle(CHANNELS.listRepositories, () => repos.repositories());
  ipcMain.handle(CHANNELS.listBranches, (_event, repository: IRepositoryRef) =>
    repos.branches(repository),
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
  ipcMain.handle(CHANNELS.askAssistant, (_event, ask: IAssistantAsk) =>
    assistant.ask(ask),
  );
  ipcMain.handle(CHANNELS.stopAssistant, () => {
    assistant.stop();
  });
  ipcMain.on(CHANNELS.appToolAnswer, (_event, answer: IAppToolAnswer) => {
    bridge.answer(answer);
  });
  ipcMain.handle(CHANNELS.startBuild, (_event, build: IStartBuild) =>
    builder.start(build),
  );
  ipcMain.handle(CHANNELS.stopBuild, (_event, buildId: string) => {
    builder.stop(buildId);
  });

  createWindow();

  app.on('activate', () => {
    if (appWindows().length === 0) createWindow();
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
  replays.close();
  tools.close();
  mcp.close();
  login.close();
  github.cancelSignIn();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
