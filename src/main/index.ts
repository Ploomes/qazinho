import type { AppLook } from '@/harness';
import type {
  AgentSignInProgress,
  ConfluenceSwitch,
  GithubSignInProgress,
  ICommentBug,
  IFileBug,
  IFilingEvent,
  IPublishPlan,
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
  IJiraStoryCopy,
  IConnectIntegration,
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
  IStartBuild,
  IStartRun,
  IStartSuiteChange,
  IStartSuiteRun,
  IViewport,
  IWindowControls,
  McpSignInProgress,
  PickKind,
  QaReply,
  SaveOutcome,
  SuiteChangeEvent,
  SuiteEvent,
  SuitePick,
  SuiteShipWay,
  WindowFit,
} from '@/shared/types';
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir, release, tmpdir } from 'node:os';
import { delimiter, extname, join } from 'node:path';
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
import { Harness, McpHost, mcpConfigWith } from '@/harness';
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
  AssistantAgent,
  BugFiler,
  BugReviewer,
  CodeCopies,
  CodeExport,
  ConfluenceApi,
  DeviceToolDetector,
  GitCli,
  GithubCli,
  GithubRepos,
  IntegrationVault,
  IosDriver,
  JiraApi,
  JiraStories,
  LiveStream,
  PhonePeek,
  ProcessOwners,
  ResourceCollector,
  RunCoordinator,
  ReplayServer,
  RunAlerts,
  RunRecorder,
  SetupInstaller,
  SuiteChanges,
  SuiteRegistry,
  SuiteRunner,
  UsageReader,
  VariableVault,
} from '@/main/classes';
import { AGENT_RUN } from '@/main/classes/agents/AgentRunner/constants';
import { changeIdOf } from '@/main/classes/automation/SuiteChanges/library';
import { buildIdOf, javaHomesOf } from '@/main/classes/builds/AppBuilder/library';
import {
  listAvds,
  newestBuildTools,
  packageOfApk,
} from '@/main/classes/devices/AndroidDriver/library';
import { bundleOfPlist, listSimulators } from '@/main/classes/devices/IosDriver/library';
import { BUG_REVIEW } from '@/main/classes/integrations/BugReviewer/constants';
import { ARCHIVE } from '@/main/classes/storage/Archive/constants';
import {
  ASSISTANT,
  FILE_FILTERS,
  PATHS,
  SAVED_VIDEO,
  APP_USER_MODEL_ID,
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
  findOnPath,
  fittedBounds,
  imageExtensionOf,
  isInternalNavigation,
  isLostSession,
  isSealable,
  machineDirectories,
  execCommand,
  diagnosticsOf,
  linuxTerminalOf,
  spawnCommand,
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
    | SuiteEvent
    | SuiteChangeEvent
    | IFilingEvent;
}): void {
  for (const open of appWindows()) open.webContents.send(props.channel, props.event);
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

const appLog = new AppLog({ folder: app.getPath('logs'), home: homedir() });

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
  openUrl: (url) => shell.openExternal(url),
  openScript: (file) => openInTerminal(file),
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
const git = new GitCli({ directories: commandDirectories });
const suites = new SuiteRegistry({ root: PATHS.suites, git });
const suiteRunner = new SuiteRunner({
  registry: suites,
  node: async () =>
    findOnPath({ command: 'node', directories: await commandDirectories() }),
  env: suiteEnvOf,
  values: (projectId) => variables.valuesOf(projectId).catch(() => []),
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

    if (event.workspaceId.startsWith(BUG_REVIEW.scopePrefix)) return;

    const changeId = changeIdOf(event.workspaceId);

    if (changeId !== null) {
      if (event.kind === 'text' || event.kind === 'action')
        suiteChanges.hear({ changeId, text: event.text });

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

const bugReviewer = new BugReviewer({
  filer: bugFiler,
  runner: agentRunner,
  harness,
  findCommand,
  runsRoot: join(PATHS.data, ARCHIVE.runs),
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

const suiteChanges = new SuiteChanges({
  registry: suites,
  suites: suiteRunner,
  git,
  github,
  runner: agentRunner,
  harness,
  tools,
  findCommand,
  values: (projectId) => variables.valuesOf(projectId).catch(() => []),
  path: async () => (await commandDirectories()).join(delimiter),
  root: PATHS.suites,
  onEvent: (event) => {
    broadcast({ channel: CHANNELS.suiteChangeEvent, event });
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
const askingChats = new Set<string>();
const stoppedChats = new Set<string>();

async function askOnce(props: {
  ask: IAskAgent;
  command: string;
  sessionId: string | null;
  look: AppLook | null;
  code: ICodeCopy | null;
  story: IJiraStoryCopy | null;
  page: IConfluencePage | null;
}): Promise<{ turn: IAgentTurn; told: Record<string, string> }> {
  const { ask, command, sessionId, look, code, story, page } = props;
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
    story,
    page,
    design: ask.design,
    variables: ask.variables,
  });
  const servers = chat.design.servers;
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
    readDirs: chat.readDirs,
    ...(servers.length === 0
      ? {}
      : {
          mcpConfig: mcpConfigWith({ config: null, servers }) ?? undefined,
          ...(chat.readDirs.length === 0
            ? {}
            : { tools: AGENT_RUN.readTools.split(',') }),
        }),
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
    const [look, prepared, read, opened] = await Promise.all([
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

    if (opened !== null)
      confluencePages.set(ask.workspaceId, { page: opened.page, text: opened.text });

    const code = codeCopies.copyOf(ask.workspaceId);
    const story = jiraStories.storyOf(ask.workspaceId);
    const page = confluencePages.get(ask.workspaceId) ?? null;
    const first = await askOnce({
      ask,
      command,
      sessionId: ask.sessionId,
      look,
      code,
      story,
      page,
    });
    const isLost =
      first.turn.isError &&
      ask.sessionId !== null &&
      !stoppedChats.has(ask.workspaceId) &&
      isLostSession(first.turn.text);
    const { turn, told } = isLost
      ? await askOnce({ ask, command, sessionId: null, look, code, story, page })
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

    if (!turn.isError && turn.sessionId !== null) toldChats.set(turn.sessionId, told);

    const answer = turn.isError ? null : harness.readChat(turn.text);

    if (answer?.plan && code !== null) await codeCopies.release(ask.workspaceId);
    if (answer?.plan && story !== null) await jiraStories.release(ask.workspaceId);
    if (answer?.plan) confluencePages.delete(ask.workspaceId);

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
        story === null
          ? null
          : { key: story.story.key, summary: story.story.summary, url: story.story.url },
      page: page?.page ?? null,
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

  const served = replays.suiteFileOfUrl(props.src);

  return served === null ? bytesOfDataUrl(props.src) : readFile(served).catch(() => null);
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

if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID);

void app.whenReady().then(async () => {
  appLog.write({
    level: 'info',
    scope: 'app',
    message: `QAzinho ${app.getVersion()} started on ${process.platform} ${release()} ${process.arch}`,
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
  void codeCopies.sweep();
  void jiraStories.sweep();
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
    confluencePages.delete(workspaceId);
    await archive.removeWorkspace(workspaceId);
  });
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
  ipcMain.handle(CHANNELS.startSuiteChange, (_event, start: IStartSuiteChange) =>
    suiteChanges.start(start),
  );
  ipcMain.handle(CHANNELS.stopSuiteChange, (_event, changeId: string) => {
    suiteChanges.stop(changeId);
  });
  ipcMain.handle(CHANNELS.suiteChanges, (_event, projectId: string) =>
    suiteChanges.changes(projectId),
  );
  ipcMain.handle(
    CHANNELS.shipSuiteChange,
    (_event, props: { projectId: string; changeId: string; way: SuiteShipWay }) =>
      suiteChanges.ship(props),
  );
  ipcMain.handle(
    CHANNELS.discardSuiteChange,
    (_event, props: { projectId: string; changeId: string }) =>
      suiteChanges.discard(props),
  );
  ipcMain.handle(CHANNELS.openLogs, async () => {
    await mkdir(appLog.where, { recursive: true });
    await shell.openPath(appLog.where);
  });
  ipcMain.handle(CHANNELS.copyDiagnostics, async () => {
    await clipboard.writeText(
      diagnosticsOf({
        version: app.getVersion(),
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
  ipcMain.handle(CHANNELS.githubStatus, () => github.status());
  ipcMain.handle(CHANNELS.signInGithub, () => github.signIn());
  ipcMain.handle(CHANNELS.cancelGithubSignIn, () => {
    github.cancelSignIn();
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
