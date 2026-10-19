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
      }),
    stopAgent: () => Promise.resolve(),
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
    listMcpServers: () => Promise.resolve([{ id: 'figma', state: 'missing' }]),
    connectMcpServer: (signIn) =>
      Promise.resolve({ target: signIn.target, steps: ['check'], phase: 'connected' }),
    cancelMcpSignIn: () => Promise.resolve(),
    onMcpSignIn: () => () => undefined,
    removeMcpServer: () => Promise.resolve({ ok: true }),
  };
}
