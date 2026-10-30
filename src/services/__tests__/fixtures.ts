import type { IQazinhoApi, Platform } from '@/shared/types';

/** Uma bridge como a do preload, para um teste que precisa que a página tenha uma. */
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
        story: null,
        page: null,
      }),
    stopAgent: () => Promise.resolve(),
    readAgentLimits: () => Promise.resolve(null),
    exportCode: () => Promise.resolve({ kind: 'cancelled' }),
    onAgentEvent: () => () => undefined,
    signInAgent: (agentId) =>
      Promise.resolve({
        agentId,
        steps: ['start', 'browser'],
        phase: 'connected',
      }),
    cancelAgentSignIn: () => Promise.resolve(),
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
    answerRun: () => Promise.resolve(),
    runsInFlight: () => Promise.resolve([]),
    resizeDevice: () => Promise.resolve(),
    focusDevice: () => Promise.resolve(),
    onRunEvent: () => () => undefined,
    replayUrl: () => Promise.resolve(null),
    saveReplay: () => Promise.resolve('cancelled' as const),
    runNetwork: () => Promise.resolve(null),
    replayVideo: () => Promise.resolve(null),
    removedVideo: () => Promise.resolve(null),
    storageUsage: () =>
      Promise.resolve({ videos: 0, screens: 0, builds: 0, other: 0, total: 0 }),
    sweepVideos: () => Promise.resolve({ removed: 0, freedBytes: 0 }),
    saveVideo: () => Promise.resolve('cancelled' as const),
    pickSuite: () => Promise.resolve({ kind: 'cancelled' as const }),
    suiteOf: () => Promise.resolve(null),
    forgetSuite: () => Promise.resolve(),
    runSuite: () => Promise.resolve(),
    stopSuite: () => Promise.resolve(),
    suiteRuns: () => Promise.resolve([]),
    openSuiteTrace: () => Promise.resolve(false),
    onSuiteEvent: () => () => undefined,
    startSuiteChange: () => Promise.reject(new Error('no agent here')),
    stopSuiteChange: () => Promise.resolve(),
    suiteChanges: () => Promise.resolve([]),
    shipSuiteChange: () => Promise.reject(new Error('no git here')),
    discardSuiteChange: () => Promise.resolve(null),
    onSuiteChangeEvent: () => () => undefined,
    listSuite: () =>
      Promise.resolve({ kind: 'failed' as const, reason: 'no-suite' as const, said: '' }),
    alertRun: () => undefined,
    onOpenRun: () => () => undefined,
    readState: () => Promise.resolve({ projects: '[]', workspaces: [] }),
    saveProjects: () => Promise.resolve(),
    saveWorkspace: () => Promise.resolve(),
    removeWorkspace: () => Promise.resolve(),
    readUnreadPlan: () => Promise.resolve({ status: 'gone' as const }),
    showUnreadPlan: () => Promise.resolve(),
    readShot: () => Promise.resolve(null),
    saveShot: () => Promise.resolve('cancelled'),
    copyShot: () => Promise.resolve(false),
    pickFile: () => Promise.resolve(null),
    fitWindow: () => Promise.resolve(),
    paintWindowControls: () => Promise.resolve(),
    openLogs: () => Promise.resolve(),
    copyDiagnostics: () => Promise.resolve(true),
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
    connectIntegration: () =>
      Promise.resolve({ isConnected: false, failure: { reason: 'unreachable' } }),
    disconnectIntegration: () => Promise.resolve(),
    listVariables: () => Promise.resolve([]),
    applyVariables: () => Promise.resolve({ isSaved: true, variables: [] }),
    forgetVariables: () => Promise.resolve(),
    copyVariables: () => Promise.resolve({ isSaved: true, variables: [] }),
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
    proStatus: () => Promise.resolve({ isSignedIn: false, canKeepToken: true }),
    signInPro: () =>
      Promise.resolve({
        steps: ['code', 'browser', 'account'],
        phase: 'connected',
        account: 'ana@loja.dev',
      }),
    cancelProSignIn: () => Promise.resolve(),
    onProSignIn: () => () => undefined,
    signOutPro: () => Promise.resolve({ isSignedIn: false, canKeepToken: true }),
    proShares: () => Promise.resolve([]),
    publishPro: ({ batch, orgSlug }) =>
      Promise.resolve({
        projectId: batch.project.projectId,
        orgSlug,
        state: 'synced',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }),
    sendProPlans: ({ project }) =>
      Promise.resolve({
        projectId: project.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }),
    unlinkPro: (projectId) =>
      Promise.resolve({
        projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }),
    removeProProject: () => Promise.resolve({ isRemoved: true }),
    briefPro: ({ plans, runs, bugs }) =>
      Promise.resolve({
        plans: plans.length,
        runs: runs.length,
        bugs: bugs.length,
        mediaBytes: 0,
      }),
    syncPro: ({ project }) =>
      Promise.resolve({
        projectId: project.projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }),
    onProSync: () => () => undefined,
    resolveProConflict: ({ projectId }) =>
      Promise.resolve({
        projectId,
        orgSlug: null,
        state: 'off',
        syncedAt: null,
        pending: [],
        conflicts: [],
      }),
    listOrgProjects: () => Promise.resolve({ isListed: true, projects: [] }),
    downloadOrgProject: () => Promise.resolve({ isDownloaded: false, failure: 'gone' }),
    openProPage: () => Promise.resolve(true),
    onProLink: () => () => undefined,
    takeProLink: () => Promise.resolve(null),
    listRepositories: () => Promise.resolve({ isListed: false, failure: 'no-cli' }),
    listBranches: () => Promise.resolve({ isListed: false, failure: 'no-cli' }),
    searchJira: () => Promise.resolve({ isListed: false, failure: 'not-connected' }),
    listJiraProjects: () =>
      Promise.resolve({ isListed: false, failure: 'not-connected' }),
    switchConfluence: () =>
      Promise.resolve({ isSwitched: false, failure: 'not-connected', said: '' }),
    searchConfluence: () =>
      Promise.resolve({ isListed: false, failure: 'not-connected' }),
    listConfluenceSpaces: () =>
      Promise.resolve({ isListed: false, failure: 'not-connected' }),
    publishPlan: () =>
      Promise.resolve({ isPublished: false, failure: 'not-connected', said: '' }),
    fileBug: () =>
      Promise.resolve({ isFiled: false, failure: 'not-connected', said: '' }),
    onFilingEvent: () => () => undefined,
    reviewBug: () => Promise.resolve({ isReviewed: false, failure: 'agent', said: '' }),
    commentBug: () =>
      Promise.resolve({ isPosted: false, failure: 'not-connected', said: '' }),
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
