import type {
  AgentSignInProgress,
  BugComment,
  BugFiling,
  BugReview,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceSwitch,
  ExportOutcome,
  GithubSignInProgress,
  IAgentEvent,
  IAgentLimits,
  IApplyVariables,
  IAppToolAnswer,
  IAppToolRequest,
  IAskAgent,
  IAssistantAsk,
  IAssistantTurn,
  IBranchList,
  IBuildEvent,
  IBuildResult,
  IChatTurn,
  ICommentBug,
  IConnectIntegration,
  IConnectResult,
  IDetectedAgent,
  IDeviceTools,
  IExportCode,
  IFileBug,
  IFilingEvent,
  IGithubStatus,
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  IMcpServerStatus,
  IMcpServerTarget,
  IMcpSignIn,
  INetworkEntry,
  InstallableId,
  IntegrationId,
  IProjectVariables,
  IProLink,
  IProPublishBrief,
  IProShare,
  IProSyncBatch,
  IPublishPlan,
  IQazinhoApi,
  IRemovedVideo,
  IRepositoryList,
  IRepositoryRef,
  IResourceSnapshot,
  IReviewBug,
  IRunAlert,
  IRunEvent,
  IRunInFlight,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
  ISetupEvent,
  IStartBuild,
  IStartRun,
  IStartSuiteChange,
  IStartSuiteRun,
  IStorageUsage,
  ISuite,
  ISuiteChange,
  ISuiteRun,
  IVideoSweep,
  IViewport,
  IWindowControls,
  JiraIssueList,
  JiraProjectList,
  McpActionResult,
  McpSignInProgress,
  PickKind,
  PlanPublished,
  Platform,
  ProDownload,
  ProOrgProjects,
  ProRemoval,
  ProSignInProgress,
  ProStatus,
  QaReply,
  SaveOutcome,
  SuiteChangeEvent,
  SuiteEvent,
  SuiteList,
  SuitePick,
  SuiteShipOutcome,
  SuiteShipWay,
  UnreadPlanRead,
  VariablesOutcome,
  WindowFit,
} from '@/shared/types';
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS, RECORDER_ARGUMENT } from '@/shared/constants';
import { recorderApi } from './recorderApi';

const api: IQazinhoApi = {
  platform: process.platform as Platform,
  detectAgents: () =>
    ipcRenderer.invoke(CHANNELS.detectAgents) as Promise<IDetectedAgent[]>,
  readResources: () =>
    ipcRenderer.invoke(CHANNELS.readResources) as Promise<IResourceSnapshot>,
  detectDeviceTools: () =>
    ipcRenderer.invoke(CHANNELS.detectDeviceTools) as Promise<IDeviceTools>,
  askAgent: (ask: IAskAgent) =>
    ipcRenderer.invoke(CHANNELS.askAgent, ask) as Promise<IChatTurn>,
  stopAgent: (workspaceId: string) =>
    ipcRenderer.invoke(CHANNELS.stopAgent, workspaceId) as Promise<void>,
  readAgentLimits: (agentId: string) =>
    ipcRenderer.invoke(CHANNELS.readAgentLimits, agentId) as Promise<IAgentLimits | null>,
  onAgentEvent: (listener: (event: IAgentEvent) => void) => {
    const forward = (_: unknown, event: IAgentEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.agentEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.agentEvent, forward);
    };
  },
  signInAgent: (agentId: string) =>
    ipcRenderer.invoke(CHANNELS.signInAgent, agentId) as Promise<AgentSignInProgress>,
  cancelAgentSignIn: (agentId: string) =>
    ipcRenderer.invoke(CHANNELS.cancelAgentSignIn, agentId) as Promise<void>,
  sendAgentSignInCode: (props: { agentId: string; code: string }) =>
    ipcRenderer.invoke(CHANNELS.sendAgentSignInCode, props) as Promise<void>,
  onAgentSignIn: (listener: (progress: AgentSignInProgress) => void) => {
    const forward = (_: unknown, progress: AgentSignInProgress) => {
      listener(progress);
    };

    ipcRenderer.on(CHANNELS.agentSignInEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.agentSignInEvent, forward);
    };
  },
  startRun: (run: IStartRun) =>
    ipcRenderer.invoke(CHANNELS.startRun, run) as Promise<void>,
  exportCode: (request: IExportCode) =>
    ipcRenderer.invoke(CHANNELS.exportCode, request) as Promise<ExportOutcome>,
  pauseRun: (props: { workspaceId: string; isPaused: boolean }) =>
    ipcRenderer.invoke(CHANNELS.pauseRun, props) as Promise<void>,
  stopRun: (workspaceId: string) =>
    ipcRenderer.invoke(CHANNELS.stopRun, workspaceId) as Promise<void>,
  answerRun: (props: { workspaceId: string; questionId: string; reply: QaReply }) =>
    ipcRenderer.invoke(CHANNELS.answerRun, props) as Promise<void>,
  resizeDevice: (props: { workspaceId: string; viewport: IViewport }) =>
    ipcRenderer.invoke(CHANNELS.resizeDevice, props) as Promise<void>,
  focusDevice: (props: { workspaceId: string; isFocused: boolean }) =>
    ipcRenderer.invoke(CHANNELS.focusDevice, props) as Promise<void>,
  runsInFlight: () =>
    ipcRenderer.invoke(CHANNELS.runsInFlight) as Promise<IRunInFlight[]>,
  onRunEvent: (listener: (event: IRunEvent) => void) => {
    const forward = (_: unknown, event: IRunEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.runEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.runEvent, forward);
    };
  },
  replayUrl: (run: IRunRef) =>
    ipcRenderer.invoke(CHANNELS.replayUrl, run) as Promise<string | null>,
  saveReplay: (props: IRunRef & { name: string }) =>
    ipcRenderer.invoke(CHANNELS.saveReplay, props) as Promise<SaveOutcome>,
  runNetwork: (run: IRunRef) =>
    ipcRenderer.invoke(CHANNELS.runNetwork, run) as Promise<INetworkEntry[] | null>,
  replayVideo: (run: IRunRef) =>
    ipcRenderer.invoke(CHANNELS.replayVideo, run) as Promise<Uint8Array | null>,
  removedVideo: (run: IRunRef) =>
    ipcRenderer.invoke(CHANNELS.removedVideo, run) as Promise<IRemovedVideo | null>,
  storageUsage: () => ipcRenderer.invoke(CHANNELS.storageUsage) as Promise<IStorageUsage>,
  sweepVideos: (olderThanDays: number) =>
    ipcRenderer.invoke(CHANNELS.sweepVideos, olderThanDays) as Promise<IVideoSweep>,
  saveVideo: (props: { name: string; data: Uint8Array }) =>
    ipcRenderer.invoke(CHANNELS.saveVideo, props) as Promise<SaveOutcome>,
  pickSuite: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.pickSuite, projectId) as Promise<SuitePick>,
  suiteOf: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.suiteOf, projectId) as Promise<ISuite | null>,
  forgetSuite: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.forgetSuite, projectId) as Promise<void>,
  listSuite: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.listSuite, projectId) as Promise<SuiteList>,
  runSuite: (start: IStartSuiteRun) =>
    ipcRenderer.invoke(CHANNELS.runSuite, start) as Promise<void>,
  stopSuite: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.stopSuite, projectId) as Promise<void>,
  suiteRuns: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.suiteRuns, projectId) as Promise<ISuiteRun[]>,
  openSuiteTrace: (trace: { projectId: string; runId: string; file: string }) =>
    ipcRenderer.invoke(CHANNELS.openSuiteTrace, trace) as Promise<boolean>,
  onSuiteEvent: (listener: (event: SuiteEvent) => void) => {
    const forward = (_: unknown, event: SuiteEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.suiteEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.suiteEvent, forward);
    };
  },
  startSuiteChange: (start: IStartSuiteChange) =>
    ipcRenderer.invoke(CHANNELS.startSuiteChange, start) as Promise<ISuiteChange>,
  stopSuiteChange: (changeId: string) =>
    ipcRenderer.invoke(CHANNELS.stopSuiteChange, changeId) as Promise<void>,
  suiteChanges: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.suiteChanges, projectId) as Promise<ISuiteChange[]>,
  shipSuiteChange: (props: { projectId: string; changeId: string; way: SuiteShipWay }) =>
    ipcRenderer.invoke(CHANNELS.shipSuiteChange, props) as Promise<SuiteShipOutcome>,
  discardSuiteChange: (props: { projectId: string; changeId: string }) =>
    ipcRenderer.invoke(
      CHANNELS.discardSuiteChange,
      props,
    ) as Promise<ISuiteChange | null>,
  onSuiteChangeEvent: (listener: (event: SuiteChangeEvent) => void) => {
    const forward = (_: unknown, event: SuiteChangeEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.suiteChangeEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.suiteChangeEvent, forward);
    };
  },
  alertRun: (notice: IRunAlert) => {
    ipcRenderer.send(CHANNELS.alertRun, notice);
  },
  onOpenRun: (listener: (run: IRunRef) => void) => {
    const forward = (_: unknown, run: IRunRef) => {
      listener(run);
    };

    ipcRenderer.on(CHANNELS.openRun, forward);

    return () => {
      ipcRenderer.off(CHANNELS.openRun, forward);
    };
  },
  readState: () => ipcRenderer.invoke(CHANNELS.readState) as Promise<ISavedState>,
  saveProjects: (json: string) =>
    ipcRenderer.invoke(CHANNELS.saveProjects, json) as Promise<void>,
  saveWorkspace: (saved: ISavedWorkspace) =>
    ipcRenderer.invoke(CHANNELS.saveWorkspace, saved) as Promise<void>,
  removeWorkspace: (workspaceId: string) =>
    ipcRenderer.invoke(CHANNELS.removeWorkspace, workspaceId) as Promise<void>,
  readUnreadPlan: (unread: { workspaceId: string; file: string }) =>
    ipcRenderer.invoke(CHANNELS.readUnreadPlan, unread) as Promise<UnreadPlanRead>,
  showUnreadPlan: (unread: { workspaceId: string; file: string }) =>
    ipcRenderer.invoke(CHANNELS.showUnreadPlan, unread) as Promise<void>,
  readShot: (file: string) =>
    ipcRenderer.invoke(CHANNELS.readShot, file) as Promise<string | null>,
  saveShot: (props: { file: string | null; src: string | null; name: string }) =>
    ipcRenderer.invoke(CHANNELS.saveShot, props) as Promise<SaveOutcome>,
  copyShot: (shot: { file: string | null; src: string | null }) =>
    ipcRenderer.invoke(CHANNELS.copyShot, shot) as Promise<boolean>,
  pickFile: (kind: PickKind) =>
    ipcRenderer.invoke(CHANNELS.pickFile, kind) as Promise<string | null>,
  fitWindow: (fit: WindowFit) =>
    ipcRenderer.invoke(CHANNELS.fitWindow, fit) as Promise<void>,
  paintWindowControls: (controls: IWindowControls) =>
    ipcRenderer.invoke(CHANNELS.paintWindowControls, controls) as Promise<void>,
  openLogs: () => ipcRenderer.invoke(CHANNELS.openLogs) as Promise<void>,
  copyDiagnostics: () => ipcRenderer.invoke(CHANNELS.copyDiagnostics) as Promise<boolean>,
  checkMachine: () => ipcRenderer.invoke(CHANNELS.checkMachine) as Promise<IMachineCheck>,
  installTool: (item: InstallableId) =>
    ipcRenderer.invoke(CHANNELS.installTool, item) as Promise<IInstallResult>,
  onSetupEvent: (listener: (event: ISetupEvent) => void) => {
    const forward = (_: unknown, event: ISetupEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.setupEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.setupEvent, forward);
    };
  },
  listIntegrations: () =>
    ipcRenderer.invoke(CHANNELS.listIntegrations) as Promise<IIntegrationStatus[]>,
  connectIntegration: (connecting: IConnectIntegration) =>
    ipcRenderer.invoke(
      CHANNELS.connectIntegration,
      connecting,
    ) as Promise<IConnectResult>,
  disconnectIntegration: (id: IntegrationId) =>
    ipcRenderer.invoke(CHANNELS.disconnectIntegration, id) as Promise<void>,
  listVariables: () =>
    ipcRenderer.invoke(CHANNELS.listVariables) as Promise<IProjectVariables[]>,
  applyVariables: (apply: IApplyVariables) =>
    ipcRenderer.invoke(CHANNELS.applyVariables, apply) as Promise<VariablesOutcome>,
  forgetVariables: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.forgetVariables, projectId) as Promise<void>,
  copyVariables: (props: { from: string; to: string }) =>
    ipcRenderer.invoke(CHANNELS.copyVariables, props) as Promise<VariablesOutcome>,
  githubStatus: () => ipcRenderer.invoke(CHANNELS.githubStatus) as Promise<IGithubStatus>,
  signInGithub: () =>
    ipcRenderer.invoke(CHANNELS.signInGithub) as Promise<GithubSignInProgress>,
  cancelGithubSignIn: () =>
    ipcRenderer.invoke(CHANNELS.cancelGithubSignIn) as Promise<void>,
  onGithubSignIn: (listener: (progress: GithubSignInProgress) => void) => {
    const forward = (_: unknown, progress: GithubSignInProgress) => {
      listener(progress);
    };

    ipcRenderer.on(CHANNELS.githubSignInEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.githubSignInEvent, forward);
    };
  },
  proStatus: () => ipcRenderer.invoke(CHANNELS.proStatus) as Promise<ProStatus>,
  signInPro: () => ipcRenderer.invoke(CHANNELS.signInPro) as Promise<ProSignInProgress>,
  cancelProSignIn: () => ipcRenderer.invoke(CHANNELS.cancelProSignIn) as Promise<void>,
  onProSignIn: (listener: (progress: ProSignInProgress) => void) => {
    const forward = (_: unknown, progress: ProSignInProgress) => {
      listener(progress);
    };

    ipcRenderer.on(CHANNELS.proSignInEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.proSignInEvent, forward);
    };
  },
  signOutPro: () => ipcRenderer.invoke(CHANNELS.signOutPro) as Promise<ProStatus>,
  proShares: () => ipcRenderer.invoke(CHANNELS.proShares) as Promise<IProShare[]>,
  publishPro: (props: {
    batch: IProSyncBatch;
    orgSlug: string;
    hasHistoryMedia: boolean;
  }) => ipcRenderer.invoke(CHANNELS.publishPro, props) as Promise<IProShare>,
  syncPro: (batch: IProSyncBatch) =>
    ipcRenderer.invoke(CHANNELS.syncPro, batch) as Promise<IProShare>,
  sendProPlans: (batch: IProSyncBatch) =>
    ipcRenderer.invoke(CHANNELS.sendProPlans, batch) as Promise<IProShare>,
  unlinkPro: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.unlinkPro, projectId) as Promise<IProShare>,
  removeProProject: (projectId: string) =>
    ipcRenderer.invoke(CHANNELS.removeProProject, projectId) as Promise<ProRemoval>,
  briefPro: (batch: IProSyncBatch) =>
    ipcRenderer.invoke(CHANNELS.briefPro, batch) as Promise<IProPublishBrief>,
  onProSync: (listener: (share: IProShare) => void) => {
    const forward = (_: unknown, share: IProShare) => {
      listener(share);
    };

    ipcRenderer.on(CHANNELS.proSyncEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.proSyncEvent, forward);
    };
  },
  resolveProConflict: (props: {
    projectId: string;
    workspaceId: string;
    version: number;
  }) => ipcRenderer.invoke(CHANNELS.resolveProConflict, props) as Promise<IProShare>,
  listOrgProjects: (orgSlug: string) =>
    ipcRenderer.invoke(CHANNELS.listOrgProjects, orgSlug) as Promise<ProOrgProjects>,
  downloadOrgProject: (props: { orgSlug: string; projectId: string }) =>
    ipcRenderer.invoke(CHANNELS.downloadOrgProject, props) as Promise<ProDownload>,
  onProLink: (listener: () => void) => {
    const forward = () => {
      listener();
    };

    ipcRenderer.on(CHANNELS.proLinkArrived, forward);

    return () => {
      ipcRenderer.off(CHANNELS.proLinkArrived, forward);
    };
  },
  takeProLink: () => ipcRenderer.invoke(CHANNELS.takeProLink) as Promise<IProLink | null>,
  openProPage: (path: string) =>
    ipcRenderer.invoke(CHANNELS.openProPage, path) as Promise<boolean>,
  listRepositories: () =>
    ipcRenderer.invoke(CHANNELS.listRepositories) as Promise<IRepositoryList>,
  listBranches: (repository: IRepositoryRef) =>
    ipcRenderer.invoke(CHANNELS.listBranches, repository) as Promise<IBranchList>,
  searchJira: (query: string) =>
    ipcRenderer.invoke(CHANNELS.searchJira, query) as Promise<JiraIssueList>,
  listJiraProjects: () =>
    ipcRenderer.invoke(CHANNELS.listJiraProjects) as Promise<JiraProjectList>,
  switchConfluence: (isOn: boolean) =>
    ipcRenderer.invoke(CHANNELS.switchConfluence, isOn) as Promise<ConfluenceSwitch>,
  searchConfluence: (query: string) =>
    ipcRenderer.invoke(CHANNELS.searchConfluence, query) as Promise<ConfluencePageList>,
  listConfluenceSpaces: () =>
    ipcRenderer.invoke(CHANNELS.listConfluenceSpaces) as Promise<ConfluenceSpaceList>,
  publishPlan: (plan: IPublishPlan) =>
    ipcRenderer.invoke(CHANNELS.publishPlan, plan) as Promise<PlanPublished>,
  fileBug: (request: IFileBug) =>
    ipcRenderer.invoke(CHANNELS.fileBug, request) as Promise<BugFiling>,
  onFilingEvent: (listener: (event: IFilingEvent) => void) => {
    const forward = (_: unknown, event: IFilingEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.filingEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.filingEvent, forward);
    };
  },
  reviewBug: (request: IReviewBug) =>
    ipcRenderer.invoke(CHANNELS.reviewBug, request) as Promise<BugReview>,
  commentBug: (request: ICommentBug) =>
    ipcRenderer.invoke(CHANNELS.commentBug, request) as Promise<BugComment>,
  listMcpServers: (agentId: string) =>
    ipcRenderer.invoke(CHANNELS.listMcpServers, agentId) as Promise<IMcpServerStatus[]>,
  connectMcpServer: (signIn: IMcpSignIn) =>
    ipcRenderer.invoke(CHANNELS.connectMcpServer, signIn) as Promise<McpSignInProgress>,
  cancelMcpSignIn: (target: IMcpServerTarget) =>
    ipcRenderer.invoke(CHANNELS.cancelMcpSignIn, target) as Promise<void>,
  onMcpSignIn: (listener: (progress: McpSignInProgress) => void) => {
    const forward = (_: unknown, progress: McpSignInProgress) => {
      listener(progress);
    };

    ipcRenderer.on(CHANNELS.mcpSignInEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.mcpSignInEvent, forward);
    };
  },
  removeMcpServer: (target: IMcpServerTarget) =>
    ipcRenderer.invoke(CHANNELS.removeMcpServer, target) as Promise<McpActionResult>,
  askAssistant: (ask: IAssistantAsk) =>
    ipcRenderer.invoke(CHANNELS.askAssistant, ask) as Promise<IAssistantTurn>,
  stopAssistant: () => ipcRenderer.invoke(CHANNELS.stopAssistant) as Promise<void>,
  onAssistantEvent: (listener: (event: IAgentEvent) => void) => {
    const forward = (_: unknown, event: IAgentEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.assistantEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.assistantEvent, forward);
    };
  },
  onAppToolCall: (listener: (request: IAppToolRequest) => void) => {
    const forward = (_: unknown, request: IAppToolRequest) => {
      listener(request);
    };

    ipcRenderer.on(CHANNELS.appToolCall, forward);

    return () => {
      ipcRenderer.off(CHANNELS.appToolCall, forward);
    };
  },
  answerAppTool: (answer: IAppToolAnswer) => {
    ipcRenderer.send(CHANNELS.appToolAnswer, answer);
  },
  startBuild: (build: IStartBuild) =>
    ipcRenderer.invoke(CHANNELS.startBuild, build) as Promise<IBuildResult>,
  stopBuild: (buildId: string) =>
    ipcRenderer.invoke(CHANNELS.stopBuild, buildId) as Promise<void>,
  onBuildEvent: (listener: (event: IBuildEvent) => void) => {
    const forward = (_: unknown, event: IBuildEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.buildEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.buildEvent, forward);
    };
  },
};

if (process.argv.includes(RECORDER_ARGUMENT))
  contextBridge.exposeInMainWorld('qazinhoRecorder', recorderApi);
else contextBridge.exposeInMainWorld('qazinho', api);
