import type { IUpdaterPort } from '@/main/classes';
import type {
  AgentSignInProgress,
  ConfluenceSwitch,
  GithubSignInProgress,
  ICommentBug,
  IFileBug,
  IFilingEvent,
  IProLink,
  IProShare,
  IProSyncBatch,
  IPublishPlan,
  IKeepMemories,
  IReviewBug,
  IAgentEvent,
  IAgentTurn,
  IAppToolAnswer,
  IApplyVariables,
  IAskAgent,
  IAssistantAsk,
  IBuildEvent,
  IChatTurn,
  ICodeCopy,
  IConfluencePage,
  IImportSource,
  IJiraStoryCopy,
  IConnectIntegration,
  IDevelopedAsk,
  IExportCode,
  InstallableId,
  IntegrationId,
  IRunAlert,
  IRunEvent,
  IRunRef,
  IRepositoryRef,
  IMcpServerTarget,
  IMcpSignIn,
  ISavedWorkspace,
  ISetupEvent,
  AppUpdate,
  IStartBuild,
  IStartRun,
  IViewport,
  IWindowControls,
  McpSignInProgress,
  OutsideToolCall,
  PickKind,
  ProSignInProgress,
  QaReply,
  SaveOutcome,
  ImportPick,
  WindowFit,
} from '@/shared/types';
import type {
  AppLook,
  IAttachSources,
  SourceCall,
} from '@salve-software/qazinho-harness';
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { homedir, hostname, release, tmpdir } from 'node:os';
import { delimiter, extname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  app,
  BrowserWindow,
  clipboard,
  ClipboardItem,
  dialog,
  ipcMain,
  nativeImage,
  safeStorage,
  screen,
  shell,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import {
  AgentDetector,
  AndroidDriver,
  AppLog,
  AgentLogin,
  AgentMcp,
  AgentRunner,
  AppBridge,
  AppBuilder,
  AppPeek,
  Archive,
  ChatDevices,
  ChatAttachments,
  AssistantAgent,
  OutsideServer,
  BugFiler,
  BugReviewer,
  MemoryKeeper,
  CodeCopies,
  CodeExport,
  ConfluenceApi,
  DeviceToolDetector,
  GitCli,
  GithubCli,
  GithubRepos,
  ImportScanner,
  IntegrationVault,
  Island,
  IosDriver,
  JiraApi,
  JiraStories,
  LiveStream,
  PhonePeek,
  ProAccount,
  ProApi,
  AppUpdater,
  canUpdateOf,
  updateFeedOf,
  ProcessOwners,
  ProDownloads,
  ProSync,
  ResourceCollector,
  RunCoordinator,
  ReplayServer,
  StorageKeeper,
  RunAlerts,
  RunRecorder,
  SetupInstaller,
  UsageReader,
  VariableVault,
} from '@/main/classes';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { MEMORY_KEEPER } from '@/main/classes/agents/MemoryKeeper/constants';
import { buildIdOf, javaHomesOf } from '@/main/classes/builds/AppBuilder/library';
import { BUG_REVIEW } from '@/main/classes/integrations/BugReviewer/constants';
import { uploaderOf } from '@/main/classes/pro/ProSync/library';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import {
  ASSISTANT,
  FILE_FILTERS,
  CHAT_SOURCES,
  OUTSIDE_WAIT,
  PATHS,
  PRO_LINK,
  PRO_API,
  SAVED_VIDEO,
  APP_USER_MODEL_ID,
  APP_VERSION,
  DIAGNOSTICS_LINES,
  WINDOW,
  WINDOW_CONTROLS,
  WINDOW_FITS,
  WINDOW_SHOW_FALLBACK_MS,
} from '@/main/constants';
import {
  agentFailure,
  bytesOfDataUrl,
  fileNameOf,
  findExistingPath,
  fittedBounds,
  imageExtensionOf,
  isInternalNavigation,
  isOpenableUrl,
  isLostSession,
  isSealable,
  machineDirectories,
  execCommand,
  diagnosticsOf,
  linuxTerminalOf,
  proLinkAddressIn,
  proLinkOf,
  proPageUrlOf,
  spawnCommand,
  sweepDaysOf,
  toldAfterTurn,
} from '@/main/library';
import { ASSISTANT_WAIT, CHANNELS, CHAT_ATTACHMENTS } from '@/shared/constants';
import {
  Harness,
  MCP_HOST,
  McpHost,
  OutsideHost,
  mcpConfigWith,
  PERMISSION_TOOL,
  pageAnswerOf,
  pagesFoundOf,
  sourceFailureOf,
  storyAnswerOf,
} from '@salve-software/qazinho-harness';
import {
  bundleOfPlist,
  listSimulators,
  listAvds,
  newestBuildTools,
  packageOfApk,
  WEB_DRIVER,
  WebDriver,
  webAccessOf,
} from '@salve-software/qazinho-harness/engine';

const agents = new AgentDetector();
const owners = new ProcessOwners();
const resources = new ResourceCollector({
  owners,
  profileRoot: PATHS.profiles,
});
const deviceTools = new DeviceToolDetector();
const archive = new Archive(PATHS.data);
const live = new LiveStream();
const chatDevices = new ChatDevices({
  profilesRoot: PATHS.profiles,
  live,
  openDriver: ({ url, profileDir, viewport, values, onAddress }) =>
    new WebDriver({
      url,
      profileDir,
      viewport,
      access: webAccessOf(values),
      onAddress,
      shrink: (shrunk: {
        image: Buffer;
        width: number;
        height: number;
        quality: number;
      }) =>
        nativeImage
          .createFromBuffer(shrunk.image)
          .resize({ width: shrunk.width, height: shrunk.height, quality: 'best' })
          .toJPEG(shrunk.quality),
    }),
  onChange: ({ workspaceId, streamUrl, address }) => {
    broadcast({
      channel: CHANNELS.agentEvent,
      event: { kind: 'device', workspaceId, streamUrl, address },
    });
  },
});
const replays = new ReplayServer({ dataRoot: PATHS.data });
const storage = new StorageKeeper({
  dataRoot: PATHS.data,
  buildsRoot: PATHS.builds,
  now: () => new Date(),
});
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

const island = new Island({
  preload: PATHS.preload,
  page: PATHS.devServer
    ? { url: `${PATHS.devServer}/island.html` }
    : { file: PATHS.island },
  onAction: (action) => {
    if (action.kind === 'answer') {
      runs.answer({
        workspaceId: action.workspaceId,
        questionId: action.questionId,
        reply: { kind: 'said', text: action.text },
      });

      return;
    }

    const [open] = appWindows();

    if (action.kind === 'open') bringForward();

    open?.webContents.send(CHANNELS.islandAction, action);
  },
});

function appWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter(
    (open) => !recorder.owns(open) && !island.owns(open),
  );
}

function bringForward(): BrowserWindow | null {
  const [open] = appWindows();

  if (!open) return null;

  if (open.isMinimized()) open.restore();

  open.show();
  open.focus();

  return open;
}

const alerts = new RunAlerts((run) => {
  bringForward()?.webContents.send(CHANNELS.openRun, run);
});

let waitingProLink: IProLink | null = null;

function receiveProLink(address: string): void {
  const link = proLinkOf(address);

  if (link === null) return;

  waitingProLink = link;
  bringForward()?.webContents.send(CHANNELS.proLinkArrived);
}

app.on('open-url', (event, address) => {
  event.preventDefault();
  receiveProLink(address);
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
    | ProSignInProgress
    | IProShare
    | IBuildEvent
    | IFilingEvent
    | AppUpdate;
}): void {
  for (const open of appWindows()) open.webContents.send(props.channel, props.event);
}

function updaterPort(): IUpdaterPort {
  return {
    listen: (listener) => {
      autoUpdater.logger = null;
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.forceDevUpdateConfig = !app.isPackaged;

      if (updateFeed !== null) autoUpdater.setFeedURL(updateFeed);

      autoUpdater.on('update-available', ({ version }) => {
        listener.available(version);
      });
      autoUpdater.on('download-progress', ({ percent }) => {
        listener.progress(percent);
      });
      autoUpdater.on('update-downloaded', ({ version }) => {
        listener.downloaded(version);
      });
      autoUpdater.on('update-not-available', () => {
        listener.nothing();
      });
      autoUpdater.on('error', (error) => {
        listener.failed(error.message);
      });
    },
    check: async () => {
      const found = await autoUpdater.checkForUpdates();

      void found?.downloadPromise?.catch(() => undefined);
    },
    install: () => {
      autoUpdater.quitAndInstall(true, true);
    },
  };
}

async function commandDirectories(): Promise<string[]> {
  return machineDirectories();
}

async function openInTerminal(file: string): Promise<boolean> {
  if (process.platform !== 'linux') return (await shell.openPath(file)) === '';

  const terminal = linuxTerminalOf({ directories: await commandDirectories(), file });

  if (terminal === null) return false;

  spawnCommand({ ...terminal, options: { detached: true, stdio: 'ignore' } }).unref();

  return true;
}

const appLog = new AppLog({ folder: PATHS.logs, home: homedir() });

async function openOutside(url: string): Promise<void> {
  if (isOpenableUrl(url)) return shell.openExternal(url);

  appLog.write({ level: 'warn', scope: 'main', message: `Refused to open ${url}` });
}

process.on('uncaughtException', (error) => {
  appLog.write({ level: 'error', scope: 'main', message: error.stack ?? error.message });
});
process.on('unhandledRejection', (reason) => {
  appLog.write({
    level: 'error',
    scope: 'main',
    message: reason instanceof Error ? (reason.stack ?? reason.message) : String(reason),
  });
});

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
  openUrl: (url) => openOutside(url),
  openScript: (file) => openInTerminal(file),
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.mcpSignInEvent, event: progress }),
  folder: PATHS.agentHome,
});
const login = new AgentLogin({
  findAgent: (agentId) => findCommand(agentId),
  openScript: (file) => openInTerminal(file),
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.agentSignInEvent, event: progress }),
  folder: PATHS.agentHome,
});
const usageReader = new UsageReader({
  findAgent: (agentId) => findCommand(agentId),
  folder: PATHS.agentHome,
  exec: async ({ command, args, cwd, timeoutMs }) => {
    await mkdir(cwd, { recursive: true });

    const { stdout } = await execCommand({
      command,
      args: [...args],
      options: { cwd, timeout: timeoutMs },
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
const updateFeed = updateFeedOf({
  feedUrl: process.env.QAZINHO_UPDATE_FEED,
  token: process.env.QAZINHO_UPDATE_TOKEN,
});
const appUpdater = new AppUpdater({
  port: updaterPort(),
  isAvailable: canUpdateOf({
    platform: process.platform,
    isPackaged: app.isPackaged,
    hasFeed: updateFeed !== null,
    appImage: process.env.APPIMAGE,
  }),
  onChange: (update) => {
    broadcast({ channel: CHANNELS.appUpdateEvent, event: update });
  },
  log: (message) => {
    appLog.write({ level: 'warn', scope: 'update', message });
  },
});
const proApi = new ProApi({
  baseUrl: PRO_API.url,
  fetcher: (url, init) => fetch(url, init),
  version: APP_VERSION,
  onUpdateRequired: () => {
    appUpdater.require();
  },
});
const proAccount = new ProAccount({
  api: proApi,
  cipher: keychain,
  file: PATHS.pro,
  machineName: hostname(),
  openUrl: (url) => openOutside(url),
  wait: (ms) => sleep(ms),
  now: () => Date.now(),
  onProgress: (progress) =>
    broadcast({ channel: CHANNELS.proSignInEvent, event: progress }),
});
const jira = new JiraApi({
  credentials: () => vault.jira(),
  fetcher: (url, init) => fetch(url, init),
});
const jiraStories = new JiraStories({ jira, root: PATHS.jira });
const confluence = new ConfluenceApi({
  credentials: () => vault.confluence(),
  jira: () => vault.jira(),
  fetcher: (url, init) => fetch(url, init),
});
const bugFiler = new BugFiler({
  jira,
  github,
  readShot: (shot) => shotBytes(shot),
  recordingOf: (run) => replays.fileOf(run),
  onEvent: (event) => broadcast({ channel: CHANNELS.filingEvent, event }),
  now: () => new Date(),
});
const variables = new VariableVault({ file: PATHS.variables, cipher: keychain });
const chatAttachments = new ChatAttachments({
  root: PATHS.attachments,
  previewOf: (file) => {
    const image = nativeImage.createFromPath(file);

    if (image.isEmpty()) return null;

    const resized = image.resize({
      width: Math.min(CHAT_ATTACHMENTS.previewWidth, image.getSize().width),
      quality: 'best',
    });

    return `data:image/jpeg;base64,${resized.toJPEG(CHAT_ATTACHMENTS.previewQuality).toString('base64')}`;
  },
});
const proSync = new ProSync({
  api: proApi,
  token: () => proAccount.token(),
  machineName: hostname(),
  file: PATHS.proSync,
  archiveRoot: PATHS.data,
  videoOf: (run) => replays.fileOf(run),
  isVideoRemoved: async (run) => (await storage.removedVideoOf(run)) !== null,
  variablesOf: async (projectId) =>
    (await variables.list()).find((kept) => kept.projectId === projectId)?.variables ??
    [],
  upload: uploaderOf((url, init) => fetch(url, init)),
  now: () => new Date(),
  schedule: ({ ms, run }) => {
    const timer = setTimeout(run, ms);

    return () => {
      clearTimeout(timer);
    };
  },
  onShare: (share) => {
    broadcast({ channel: CHANNELS.proSyncEvent, event: share });
  },
});
const proDownloads = new ProDownloads({
  api: proApi,
  token: () => proAccount.token(),
  archiveRoot: PATHS.data,
  sync: proSync,
});
const git = new GitCli({ directories: commandDirectories });
const importScanner = new ImportScanner({ git });
const agentRunner = new AgentRunner({
  owners,
  folder: PATHS.agentHome,
  permissions: {
    tool: PERMISSION_TOOL.granted,
    mcpConfig: () => tools.mcpConfigFor(MCP_HOST.permissionsScope),
  },
  onEvent: (event) => {
    const buildId = buildIdOf(event.workspaceId);

    if (buildId !== null) {
      if (event.kind === 'text' || event.kind === 'action')
        builder.hear({ buildId, text: event.text });

      return;
    }

    if (
      event.workspaceId.startsWith(BUG_REVIEW.scopePrefix) ||
      event.workspaceId.startsWith(MEMORY_KEEPER.scopePrefix)
    )
      return;

    broadcast({
      channel:
        event.workspaceId === ASSISTANT.scope
          ? CHANNELS.assistantEvent
          : CHANNELS.agentEvent,
      event,
    });
  },
});

const bugReviewer = new BugReviewer({
  filer: bugFiler,
  runner: agentRunner,
  harness,
  findCommand,
  runsRoot: join(PATHS.data, ARCHIVE.runs),
});

const memoryKeeper = new MemoryKeeper({
  runner: agentRunner,
  harness,
  findCommand,
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
      javaHome: findExistingPath([
        process.env.JAVA_HOME,
        ...javaHomesOf({ platform: process.platform, home: homedir(), env: process.env }),
      ]),
      hasXcode: found.xcode.isFound,
      path: (await commandDirectories()).join(delimiter),
    };
  },
  readPlist: (file) =>
    new Promise((settle) => {
      execCommand({
        command: 'plutil',
        args: ['-convert', 'json', '-o', '-', file],
      }).then(
        ({ stdout }) => {
          settle(stdout);
        },
        () => {
          settle(null);
        },
      );
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
      const printed =
        process.platform === 'darwin'
          ? await execCommand({
              command: 'plutil',
              args: [
                '-extract',
                'CFBundleIdentifier',
                'raw',
                join(target.value, 'Info.plist'),
              ],
            }).catch(() => null)
          : null;

      return printed === null ? null : bundleOfPlist(printed.stdout) || null;
    }

    const sdkRoot = deviceTools.detect().androidSdk.path;
    const tools =
      sdkRoot === null
        ? null
        : newestBuildTools(await readdir(join(sdkRoot, 'build-tools')).catch(() => []));

    if (sdkRoot === null || tools === null) return null;

    const dumped = await execCommand({
      command: join(sdkRoot, 'build-tools', tools, 'aapt2'),
      args: ['dump', 'packagename', target.value],
    }).catch(() => null);

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
  onEvent: (event) => {
    if (event.kind === 'failed')
      appLog.write({
        level: 'warn',
        scope: 'run',
        message: `run failed: ${event.failure.reason}`,
      });

    broadcast({ channel: CHANNELS.runEvent, event });
  },
  recorder,
  variablesOf: (projectId) => variables.valuesOf(projectId),
  keepVariable: async ({ projectId, variable }) =>
    (
      await variables.apply({
        projectId,
        changes: [{ kind: 'save', ...variable, from: null }],
      })
    ).isSaved,
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

const outsideBridge = new AppBridge<OutsideToolCall>({
  timeoutMs: OUTSIDE_WAIT.toolMs,
  send: (request) => {
    const [open] = appWindows();

    if (!open) return false;

    open.webContents.send(CHANNELS.outsideToolCall, request);

    return true;
  },
});

const outside = new OutsideServer({
  file: PATHS.outside,
  host: new OutsideHost(),
  mcp,
  agents: () => agents.detect(),
  perform: performOutside,
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
const confluencePages = new Map<string, IConfluencePage>();
const importSources = new Map<string, IImportSource>();
const askingChats = new Set<string>();
const stoppedChats = new Set<string>();

async function fetchSource(props: {
  workspaceId: string;
  call: SourceCall;
}): Promise<{ text: string; isError: boolean }> {
  const { workspaceId, call } = props;

  if (call.name === 'read_jira_story') {
    const read = await jiraStories.prepare({
      workspaceId,
      key: call.key,
      onStep: ({ at, bytes }) => {
        broadcast({
          channel: CHANNELS.agentEvent,
          event: { kind: 'jira', workspaceId, step: at, bytes },
        });
      },
    });

    return read.isReady
      ? { text: storyAnswerOf(read.copy), isError: false }
      : {
          text: sourceFailureOf({
            source: 'jira',
            failure: read.failure,
            subject: `story ${call.key}`,
          }),
          isError: true,
        };
  }

  if ((await vault.confluence()) === null)
    return {
      text: sourceFailureOf({
        source: 'confluence',
        failure: (await vault.jira()) === null ? 'not-connected' : 'off',
        subject: '',
      }),
      isError: true,
    };

  if (call.name === 'search_confluence') {
    const found = await confluence.search(call.query);

    return found.isListed
      ? { text: pagesFoundOf({ query: call.query, pages: found.pages }), isError: false }
      : {
          text: sourceFailureOf({
            source: 'confluence',
            failure: found.failure,
            subject: 'its pages',
          }),
          isError: true,
        };
  }

  const opened = await confluence.page(call.pageId);

  if (!opened.isRead)
    return {
      text: sourceFailureOf({
        source: 'confluence',
        failure: opened.failure,
        subject: `page ${call.pageId}`,
      }),
      isError: true,
    };

  const page = { page: opened.page, text: opened.text };

  confluencePages.set(workspaceId, page);

  return { text: pageAnswerOf(page), isError: false };
}

function sourcesFor(workspaceId: string): IAttachSources {
  return {
    scope: `${CHAT_SOURCES.scope}${workspaceId}`,
    fetch: (call) => fetchSource({ workspaceId, call }),
  };
}

async function askOnce(props: {
  ask: IAskAgent;
  command: string;
  sessionId: string | null;
  look: AppLook | null;
  code: ICodeCopy | null;
  source: IImportSource | null;
  story: IJiraStoryCopy | null;
  page: IConfluencePage | null;
}): Promise<{ turn: IAgentTurn; told: Record<string, string> }> {
  const { ask, command, sessionId, look, code, source, story, page } = props;
  const attachments = await chatAttachments.filesOf({
    workspaceId: ask.workspaceId,
    attachments: ask.attachments ?? [],
  });
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
    source,
    story,
    page,
    design: ask.design,
    variables: ask.variables,
    isFromAgent: ask.isFromAgent === true,
    attachments,
    memories: ask.memories ?? [],
  });
  const sources = sourcesFor(ask.workspaceId);
  const learning =
    ask.target?.kind === 'web'
      ? await chatDevices
          .ready({
            workspaceId: ask.workspaceId,
            url: ask.target.value,
            values: await variables.valuesOf(ask.projectId).catch(() => []),
            viewport: ask.viewport ?? WEB_DRIVER.viewport,
          })
          .catch(() => null)
      : null;
  const storyFolder = join(PATHS.jira, ask.workspaceId);
  const mcpConfig = mcpConfigWith({
    config: tools.mcpConfigFor(sources.scope, CHAT_SOURCES.toolMs),
    servers: chat.design.servers,
  });

  await mkdir(storyFolder, { recursive: true });
  tools.attachSources(sources);

  if (learning !== null)
    tools.attach({ workspaceId: sources.scope, driver: learning, purpose: 'learn' });

  try {
    const turn = await agentRunner.ask({
      workspaceId: ask.workspaceId,
      agentId: ask.agentId,
      command,
      model: ask.model,
      sessionId,
      prompt: chat.prompt,
      schema: chat.schema,
      systemPrompt: chat.systemPrompt,
      allowedTools: [...chat.tools.allowedTools, ...chat.design.allowedTools],
      readDirs: [...new Set([...chat.readDirs, storyFolder])],
      tools: AGENT_RUN.readTools.split(','),
      permissionTool: chat.permissionTool,
      isStreamed: true,
      ...(mcpConfig === null ? {} : { mcpConfig }),
    });

    return { turn, told: chat.told };
  } finally {
    tools.detachSources(sources.scope);

    if (learning !== null) {
      tools.detach(sources.scope);
      chatDevices.release(ask.workspaceId);
    }
  }
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
    story: null,
    page: null,
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
    const [look, prepared, read, opened, imported] = await Promise.all([
      ask.target?.kind === 'web'
        ? peek.look(
            ask.target.value,
            webAccessOf(await variables.valuesOf(ask.projectId).catch(() => [])),
          )
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
      ask.jira === null
        ? Promise.resolve(null)
        : jiraStories.prepare({
            workspaceId: ask.workspaceId,
            key: ask.jira.key,
            onStep: ({ at, bytes }) => {
              broadcast({
                channel: CHANNELS.agentEvent,
                event: { kind: 'jira', workspaceId: ask.workspaceId, step: at, bytes },
              });
            },
          }),
      ask.confluence === null
        ? Promise.resolve(null)
        : confluence.page(ask.confluence.pageId),
      ask.source === null
        ? Promise.resolve(null)
        : importScanner.sourceOf(ask.source.dir),
    ]);

    if (stoppedChats.has(ask.workspaceId)) {
      if (prepared !== null) await codeCopies.release(ask.workspaceId);
      if (read !== null) await jiraStories.release(ask.workspaceId);

      return { ...unanswered, failure: { reason: 'stopped' } };
    }

    if (prepared !== null && !prepared.isReady)
      return {
        ...unanswered,
        failure: { reason: 'code', failure: prepared.failure, said: prepared.said },
      };

    if (read !== null && !read.isReady && ask.jira !== null)
      return {
        ...unanswered,
        failure: { reason: 'jira', failure: read.failure, key: ask.jira.key },
      };

    if (opened !== null && !opened.isRead)
      return {
        ...unanswered,
        failure: { reason: 'confluence', failure: opened.failure, said: opened.said },
      };

    if (ask.source !== null && imported === null)
      return { ...unanswered, failure: { reason: 'import' } };

    if (opened !== null)
      confluencePages.set(ask.workspaceId, { page: opened.page, text: opened.text });

    if (imported !== null) importSources.set(ask.workspaceId, imported);

    const code = codeCopies.copyOf(ask.workspaceId);
    const story = jiraStories.storyOf(ask.workspaceId);
    const page = confluencePages.get(ask.workspaceId) ?? null;
    const source = importSources.get(ask.workspaceId) ?? null;
    const first = await askOnce({
      ask,
      command,
      sessionId: ask.sessionId,
      look,
      code,
      source,
      story,
      page,
    });
    const isLost =
      first.turn.isError &&
      ask.sessionId !== null &&
      !stoppedChats.has(ask.workspaceId) &&
      isLostSession(first.turn.text);
    const { turn, told } = isLost
      ? await askOnce({ ask, command, sessionId: null, look, code, source, story, page })
      : first;

    if (stoppedChats.has(ask.workspaceId))
      return {
        ...turn,
        isError: true,
        answer: null,
        failure: { reason: 'stopped' },
        code: null,
        story: null,
        page: null,
      };

    const storyRead = jiraStories.storyOf(ask.workspaceId);
    const pageRead = confluencePages.get(ask.workspaceId) ?? null;

    if (!turn.isError && turn.sessionId !== null)
      toldChats.set(
        turn.sessionId,
        toldAfterTurn({
          turn,
          told: harness.toldAfterReading({
            told,
            story: storyRead === story ? null : storyRead,
            page: pageRead === page ? null : pageRead,
          }),
        }),
      );

    const answer = turn.isError ? null : harness.readChat(turn.text);

    if (answer?.plan && code !== null) await codeCopies.release(ask.workspaceId);
    if (answer?.plan && storyRead !== null) await jiraStories.release(ask.workspaceId);
    if (answer?.plan) confluencePages.delete(ask.workspaceId);
    if (answer?.plan) importSources.delete(ask.workspaceId);

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
      story:
        storyRead === null
          ? null
          : {
              key: storyRead.story.key,
              summary: storyRead.story.summary,
              url: storyRead.story.url,
            },
      page: pageRead?.page ?? null,
    };
  } finally {
    askingChats.delete(ask.workspaceId);
    stoppedChats.delete(ask.workspaceId);
  }
}

async function switchConfluence(isOn: boolean): Promise<ConfluenceSwitch> {
  if (isOn) {
    const checked = await confluence.check();

    if (!checked.isOk)
      return { isSwitched: false, failure: checked.failure, said: checked.said };
  }

  const status = await vault.setConfluence(isOn);

  return status === null
    ? { isSwitched: false, failure: 'not-connected', said: '' }
    : { isSwitched: true, status };
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

  return bytesOfDataUrl(props.src);
}

async function copyShot(props: {
  file: string | null;
  src: string | null;
}): Promise<boolean> {
  const bytes = await shotBytes(props);
  const image = bytes === null ? null : nativeImage.createFromBuffer(bytes);

  if (image === null || image.isEmpty()) return false;

  return clipboard
    .write([
      new ClipboardItem({
        'image/png': new Blob([new Uint8Array(image.toPNG())], { type: 'image/png' }),
      }),
    ])
    .then(
      () => true,
      () => false,
    );
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

async function performOutside(
  call: OutsideToolCall,
): Promise<{ text: string; isError: boolean }> {
  const [open] = appWindows();

  if (!open) createWindow();

  if (!open || open.webContents.isLoading())
    return { text: OUTSIDE_WAIT.opening, isError: true };

  return outsideBridge.act(call);
}

async function pickImport(): Promise<ImportPick> {
  const [open] = appWindows();
  const picked = open
    ? await dialog.showOpenDialog(open, { properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ properties: ['openDirectory'] });
  const [path] = picked.filePaths;

  if (picked.canceled || path === undefined) return { kind: 'cancelled' };

  return importScanner.pick(path);
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
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 16, y: 16 } }
      : { titleBarStyle: 'hidden' as const, titleBarOverlay: { ...WINDOW_CONTROLS } }),
    webPreferences: {
      preload: PATHS.preload,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  window.webContents.on('console-message', (event) => {
    if (event.level === 'error')
      appLog.write({
        level: 'error',
        scope: 'page',
        message: `${event.message} (${event.sourceId}:${String(event.lineNumber)})`,
      });
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    appLog.write({
      level: 'error',
      scope: 'page',
      message: `the page went away: ${details.reason}, code ${String(details.exitCode)}`,
    });
  });

  window.on('focus', () => {
    alerts.seen();
  });

  window.webContents.on('did-finish-load', () => {
    bridge.dropAll();
    outsideBridge.dropAll();
  });

  window.on('closed', () => {
    bridge.dropAll();
    outsideBridge.dropAll();
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
    void openOutside(url);
    return { action: 'deny' };
  });

  if (PATHS.devServer) void window.loadURL(PATHS.devServer);
  else void window.loadFile(PATHS.renderer);
}

if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID);

if (!app.requestSingleInstanceLock()) app.exit(0);

app.on('second-instance', (_event, argv) => {
  bringForward();

  const address = proLinkAddressIn(argv);

  if (address !== undefined) receiveProLink(address);
});

void app.whenReady().then(async () => {
  appUpdater.start();
  appLog.write({
    level: 'info',
    scope: 'app',
    message: `QAzinho ${APP_VERSION} started on ${process.platform} ${release()} ${process.arch}`,
  });
  app.on('child-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit')
      appLog.write({
        level: 'warn',
        scope: 'app',
        message: `${details.type} process gone: ${details.reason}`,
      });
  });
  if (!app.isPackaged) app.dock?.setIcon(PATHS.icon);

  await live.start();
  await replays.start();
  await tools.start();
  await outside.start();
  void codeCopies.sweep();
  void jiraStories.sweep();
  void builder.sweep();
  proSync.startPulling();

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
  ipcMain.handle(CHANNELS.askAgent, (_event, ask: IAskAgent) => askAgent(ask));
  ipcMain.handle(CHANNELS.startRun, async (_event, run: IStartRun) => {
    await chatDevices.close(run.workspaceId);

    return runs.start(run);
  });
  ipcMain.handle(CHANNELS.exportCode, (_event, request: IExportCode) =>
    codeExport.export(request),
  );
  ipcMain.handle(CHANNELS.readCode, (_event, request: IExportCode) =>
    codeExport.read(request),
  );
  ipcMain.handle(CHANNELS.developedCases, (_event, ask: IDevelopedAsk) =>
    runs.developed(ask),
  );
  ipcMain.handle(
    CHANNELS.talkRun,
    (_event, props: { workspaceId: string; text: string }) => {
      runs.talk(props);
    },
  );
  ipcMain.handle(CHANNELS.replayUrl, (_event, run: IRunRef) => replays.urlFor(run));
  ipcMain.on(CHANNELS.alertRun, (event, notice: IRunAlert) => {
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
  ipcMain.handle(CHANNELS.removedVideo, (_event, run: IRunRef) =>
    storage.removedVideoOf(run),
  );
  ipcMain.handle(CHANNELS.storageUsage, () => storage.usage());
  ipcMain.handle(CHANNELS.sweepVideos, (_event, olderThanDays: unknown) => {
    const days = sweepDaysOf(olderThanDays);

    return days === null
      ? { removed: 0, freedBytes: 0 }
      : storage.sweepVideos({ olderThanDays: days });
  });
  ipcMain.handle(
    CHANNELS.saveVideo,
    (_event, props: { name: string; data: Uint8Array }) => saveVideo(props),
  );
  ipcMain.handle(CHANNELS.stopRun, (_event, workspaceId: string) => {
    runs.stop(workspaceId);
  });
  ipcMain.handle(
    CHANNELS.answerRun,
    (_event, props: { workspaceId: string; questionId: string; reply: QaReply }) => {
      runs.answer(props);
    },
  );
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
    await jiraStories.release(workspaceId);
    await chatAttachments.forget(workspaceId);
    await chatDevices.close(workspaceId);
    confluencePages.delete(workspaceId);
    importSources.delete(workspaceId);
    await archive.removeWorkspace(workspaceId);
  });
  ipcMain.handle(
    CHANNELS.readUnreadPlan,
    (_event, unread: { workspaceId: string; file: string }) =>
      archive.readUnreadPlan(unread),
  );
  ipcMain.handle(
    CHANNELS.showUnreadPlan,
    (_event, unread: { workspaceId: string; file: string }) => {
      const file = archive.unreadPlanFile(unread);

      if (file !== null) shell.showItemInFolder(file);
    },
  );
  ipcMain.handle(CHANNELS.readShot, (_event, file: string) => archive.readShot(file));
  ipcMain.handle(
    CHANNELS.saveShot,
    (_event, props: { file: string | null; src: string | null; name: string }) =>
      saveShot(props),
  );
  ipcMain.handle(
    CHANNELS.copyShot,
    (_event, shot: { file: string | null; src: string | null }) => copyShot(shot),
  );
  ipcMain.handle(CHANNELS.pickFile, (_event, kind: PickKind) => pickFile(kind));
  ipcMain.handle(CHANNELS.pickImport, () => pickImport());
  ipcMain.handle(CHANNELS.outsideServer, () => outside.status());
  ipcMain.handle(CHANNELS.outsideAgents, () => outside.agentsHere());
  ipcMain.handle(CHANNELS.turnOutsideServer, (_event, isOn: boolean) =>
    outside.turn(isOn),
  );
  ipcMain.handle(CHANNELS.renewOutsideServer, () => outside.renew());
  ipcMain.handle(CHANNELS.addOutsideAgent, (_event, agentId: string) =>
    outside.addTo(agentId),
  );
  ipcMain.handle(CHANNELS.removeOutsideAgent, (_event, agentId: string) =>
    outside.removeFrom(agentId),
  );
  ipcMain.handle(CHANNELS.copyOutsideAddress, async () => {
    const address = outside.savedAddress();

    if (address === null) return false;

    await clipboard.writeText(address);

    return true;
  });
  ipcMain.handle(CHANNELS.openLogs, async () => {
    await mkdir(appLog.where, { recursive: true });
    await shell.openPath(appLog.where);
  });
  ipcMain.handle(CHANNELS.copyDiagnostics, async () => {
    await clipboard.writeText(
      diagnosticsOf({
        version: APP_VERSION,
        system: `${process.platform} ${release()} ${process.arch}`,
        versions: {
          electron: process.versions.electron,
          chrome: process.versions.chrome,
          node: process.versions.node,
        },
        locale: app.getLocale(),
        agents: await agents.detect(),
        devices: deviceTools.detect(),
        log: await appLog.tail(DIAGNOSTICS_LINES),
      }),
    );

    return true;
  });
  ipcMain.handle(CHANNELS.paintWindowControls, (event, controls: IWindowControls) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (window !== null && process.platform !== 'darwin')
      window.setTitleBarOverlay({ ...controls, height: WINDOW_CONTROLS.height });
  });
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
  ipcMain.handle(CHANNELS.copyVariables, (_event, props: { from: string; to: string }) =>
    variables.copy(props),
  );
  ipcMain.handle(CHANNELS.pickAttachments, async (_event, workspaceId: unknown) => {
    if (typeof workspaceId !== 'string')
      return { isAttached: false, failure: { reason: 'unreadable', name: '' } };

    const [open] = appWindows();
    const options = { properties: ['openFile' as const, 'multiSelections' as const] };
    const picked = open
      ? await dialog.showOpenDialog(open, options)
      : await dialog.showOpenDialog(options);

    return picked.canceled
      ? { isAttached: true, attachments: [] }
      : chatAttachments.addFiles({ workspaceId, paths: picked.filePaths });
  });
  ipcMain.handle(
    CHANNELS.attachData,
    (_event, props: { workspaceId: unknown; name: unknown; data: unknown }) =>
      typeof props.workspaceId === 'string' &&
      typeof props.name === 'string' &&
      props.data instanceof Uint8Array
        ? chatAttachments.addData({
            workspaceId: props.workspaceId,
            name: props.name,
            data: props.data,
          })
        : { isAttached: false, failure: { reason: 'unreadable', name: '' } },
  );
  ipcMain.handle(
    CHANNELS.revealVariable,
    (_event, props: { projectId: unknown; name: unknown }) =>
      typeof props.projectId === 'string' && typeof props.name === 'string'
        ? variables.reveal({ projectId: props.projectId, name: props.name })
        : null,
  );
  ipcMain.handle(CHANNELS.githubStatus, () => github.status());
  ipcMain.handle(CHANNELS.signInGithub, () => github.signIn());
  ipcMain.handle(CHANNELS.cancelGithubSignIn, () => {
    github.cancelSignIn();
  });
  ipcMain.handle(CHANNELS.proStatus, () => proAccount.status());
  ipcMain.handle(CHANNELS.signInPro, async () => {
    const signedIn = await proAccount.signIn();

    void proSync.pull();

    return signedIn;
  });
  ipcMain.handle(CHANNELS.cancelProSignIn, () => {
    proAccount.cancelSignIn();
  });
  ipcMain.handle(CHANNELS.signOutPro, () => proAccount.signOut());
  ipcMain.handle(CHANNELS.proShares, () => proSync.shares());
  ipcMain.handle(
    CHANNELS.publishPro,
    (
      _event,
      props: { batch: IProSyncBatch; orgSlug: string; hasHistoryMedia: boolean },
    ) => proSync.publish(props),
  );
  ipcMain.handle(CHANNELS.syncPro, (_event, batch: IProSyncBatch) => proSync.push(batch));
  ipcMain.handle(CHANNELS.sendProPlans, (_event, batch: IProSyncBatch) =>
    proSync.sendPlans(batch),
  );
  ipcMain.handle(CHANNELS.unlinkPro, (_event, projectId: string) =>
    proSync.forget(projectId),
  );
  ipcMain.handle(CHANNELS.removeProProject, (_event, projectId: string) =>
    proSync.remove(projectId),
  );
  ipcMain.handle(CHANNELS.briefPro, (_event, batch: IProSyncBatch) =>
    proSync.brief(batch),
  );
  ipcMain.handle(
    CHANNELS.resolveProConflict,
    (_event, props: { projectId: string; workspaceId: string; version: number }) =>
      proSync.resolve(props),
  );
  ipcMain.handle(CHANNELS.listOrgProjects, (_event, orgSlug: string) =>
    proDownloads.list(orgSlug),
  );
  ipcMain.handle(
    CHANNELS.downloadOrgProject,
    (_event, props: { orgSlug: string; projectId: string }) =>
      proDownloads.download(props),
  );
  ipcMain.handle(CHANNELS.appUpdate, () => appUpdater.state());
  ipcMain.handle(CHANNELS.installUpdate, () => {
    appUpdater.install();
  });
  ipcMain.handle(CHANNELS.openProPage, async (_event, path: string) => {
    const url = proPageUrlOf({ base: PRO_API.web, path });

    if (url === null) return false;

    await openOutside(url);

    return true;
  });
  ipcMain.handle(CHANNELS.listRepositories, () => repos.repositories());
  ipcMain.handle(CHANNELS.searchJira, (_event, query: string) => jira.search(query));
  ipcMain.handle(CHANNELS.listJiraProjects, () => jira.projects());
  ipcMain.handle(CHANNELS.switchConfluence, (_event, isOn: boolean) =>
    switchConfluence(isOn),
  );
  ipcMain.handle(CHANNELS.searchConfluence, (_event, query: string) =>
    confluence.search(query),
  );
  ipcMain.handle(CHANNELS.listConfluenceSpaces, () => confluence.spaces());
  ipcMain.handle(CHANNELS.publishPlan, (_event, plan: IPublishPlan) =>
    confluence.publish(plan),
  );
  ipcMain.handle(CHANNELS.fileBug, (_event, request: IFileBug) => bugFiler.file(request));
  ipcMain.handle(CHANNELS.reviewBug, (_event, request: IReviewBug) =>
    bugReviewer.review(request),
  );
  ipcMain.handle(CHANNELS.keepMemories, (_event, request: IKeepMemories) =>
    memoryKeeper.keep(request),
  );
  ipcMain.handle(CHANNELS.commentBug, (_event, request: ICommentBug) =>
    bugFiler.comment(request),
  );
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
    outsideBridge.answer(answer);
  });
  ipcMain.handle(CHANNELS.startBuild, (_event, build: IStartBuild) =>
    builder.start(build),
  );
  ipcMain.handle(CHANNELS.stopBuild, (_event, buildId: string) => {
    builder.stop(buildId);
  });
  ipcMain.handle(CHANNELS.takeProLink, () => {
    const link = waitingProLink;

    waitingProLink = null;

    return link;
  });

  if (app.isPackaged) app.setAsDefaultProtocolClient(PRO_LINK.scheme);

  const launchLink = proLinkAddressIn(process.argv);

  if (launchLink !== undefined) receiveProLink(launchLink);

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

  appUpdater.stop();
  void chatDevices.closeAll();
  live.close();
  replays.close();
  island.close();
  void outside.close();
  tools.close();
  mcp.close();
  login.close();
  github.cancelSignIn();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
