import type { IQazinhoApi, Platform } from '@/shared/types';

/** A bridge like the preload's, for a test that needs the page to have one. */
export function fakeQazinhoApi(platform: Platform): IQazinhoApi {
  return {
    platform,
    detectAgents: () => Promise.resolve([]),
    askAgent: () =>
      Promise.resolve({
        sessionId: null,
        text: '',
        usage: null,
        costUsd: null,
        isError: false,
        answer: null,
        failure: null,
        code: null,
      }),
    stopAgent: () => Promise.resolve(),
    readAgentLimits: () => Promise.resolve(null),
    exportCode: () => Promise.resolve({ kind: 'cancelled' }),
    onAgentEvent: () => () => undefined,
    signInAgent: (agentId) =>
      Promise.resolve({
        agentId,
        steps: ['start', 'browser'],
        takesCode: false,
        phase: 'connected',
      }),
    cancelAgentSignIn: () => Promise.resolve(),
    sendAgentSignInCode: () => Promise.resolve(),
    onAgentSignIn: () => () => undefined,
    detectDeviceTools: () =>
      Promise.resolve({
        androidSdk: { isFound: false, path: null },
        xcode: { isFound: false, path: null },
        idb: { isFound: false, path: null },
      }),
    readResources: () =>
      Promise.resolve({ cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] }),
    startRun: () => Promise.resolve(),
    pauseRun: () => Promise.resolve(),
    stopRun: () => Promise.resolve(),
    runsInFlight: () => Promise.resolve([]),
    resizeDevice: () => Promise.resolve(),
    focusDevice: () => Promise.resolve(),
    onRunEvent: () => () => undefined,
    replayUrl: () => Promise.resolve(null),
    saveReplay: () => Promise.resolve('cancelled' as const),
    runNetwork: () => Promise.resolve(null),
    replayVideo: () => Promise.resolve(null),
    saveVideo: () => Promise.resolve('cancelled' as const),
    pickSuite: () => Promise.resolve({ kind: 'cancelled' as const }),
    suiteOf: () => Promise.resolve(null),
    forgetSuite: () => Promise.resolve(),
    listSuite: () =>
      Promise.resolve({ kind: 'failed' as const, reason: 'no-suite' as const, said: '' }),
    alertRunEnded: () => undefined,
    onOpenRun: () => () => undefined,
    readState: () => Promise.resolve({ projects: '[]', workspaces: [] }),
    saveProjects: () => Promise.resolve(),
    saveWorkspace: () => Promise.resolve(),
    removeWorkspace: () => Promise.resolve(),
    readShot: () => Promise.resolve(null),
    saveShot: () => Promise.resolve('cancelled'),
    pickFile: () => Promise.resolve(null),
    fitWindow: () => Promise.resolve(),
    checkMachine: () =>
      Promise.resolve({
        agents: [],
        tools: {
          androidSdk: { isFound: false, path: null },
          xcode: { isFound: false, path: null },
          idb: { isFound: false, path: null },
        },
        managers: {
          npm: { isFound: true, path: '/bin/npm' },
          brew: { isFound: true, path: '/bin/brew' },
        },
      }),
    installTool: () => Promise.resolve({ isInstalled: true }),
    onSetupEvent: () => () => undefined,
    listIntegrations: () => Promise.resolve([]),
    connectIntegration: () => Promise.resolve({ isConnected: false, error: 'offline' }),
    disconnectIntegration: () => Promise.resolve(),
    listVariables: () => Promise.resolve([]),
    applyVariables: () => Promise.resolve({ isSaved: true, variables: [] }),
    forgetVariables: () => Promise.resolve(),
    githubStatus: () =>
      Promise.resolve({
        cli: { isFound: false, path: null },
        account: null,
        missingScopes: [],
        failure: 'no-cli',
      }),
    signInGithub: () =>
      Promise.resolve({ steps: ['code', 'browser', 'account'], phase: 'cancelled' }),
    cancelGithubSignIn: () => Promise.resolve(),
    onGithubSignIn: () => () => undefined,
    listRepositories: () => Promise.resolve({ isListed: false, failure: 'no-cli' }),
    listBranches: () => Promise.resolve({ isListed: false, failure: 'no-cli' }),
    listMcpServers: () => Promise.resolve([{ id: 'figma', state: 'missing' }]),
    connectMcpServer: (signIn) =>
      Promise.resolve({ target: signIn.target, steps: ['check'], phase: 'connected' }),
    cancelMcpSignIn: () => Promise.resolve(),
    onMcpSignIn: () => () => undefined,
    removeMcpServer: () => Promise.resolve({ ok: true }),
    askAssistant: () =>
      Promise.resolve({
        sessionId: null,
        text: '',
        usage: null,
        costUsd: null,
        isError: false,
        failure: null,
      }),
    stopAssistant: () => Promise.resolve(),
    onAssistantEvent: () => () => undefined,
    onAppToolCall: () => () => undefined,
    answerAppTool: () => undefined,
    startBuild: () => Promise.resolve({ isBuilt: false, failure: { reason: 'stopped' } }),
    stopBuild: () => Promise.resolve(),
    onBuildEvent: () => () => undefined,
  };
}
