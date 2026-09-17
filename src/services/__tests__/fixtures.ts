import type { IGocrashApi, Platform } from '@/types';

/** A bridge like the preload's, for a test that needs the page to have one. */
export function fakeGocrashApi(platform: Platform): IGocrashApi {
  return {
    platform,
    detectAgents: () => Promise.resolve([]),
    askAgent: () =>
      Promise.resolve({ sessionId: null, text: '', usage: null, isError: false }),
    onAgentEvent: () => () => undefined,
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
    onRunEvent: () => () => undefined,
    readState: () => Promise.resolve({ projects: '[]', workspaces: [] }),
    saveProjects: () => Promise.resolve(),
    saveWorkspace: () => Promise.resolve(),
    removeWorkspace: () => Promise.resolve(),
    readShot: () => Promise.resolve(null),
    pickFile: () => Promise.resolve(null),
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
  };
}
