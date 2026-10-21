import type {
  AgentSignInProgress,
  ExportOutcome,
  GithubSignInProgress,
  IAgentEvent,
  IAgentLimits,
  IAppToolAnswer,
  IAppToolRequest,
  IApplyVariables,
  IAskAgent,
  IAssistantAsk,
  IAssistantTurn,
  IBranchList,
  IBuildEvent,
  IBuildResult,
  IChatTurn,
  IConnectIntegration,
  IConnectResult,
  IDetectedAgent,
  IDeviceTools,
  IExportCode,
  IGithubStatus,
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  IMcpServerStatus,
  IMcpServerTarget,
  IMcpSignIn,
  INetworkEntry,
  IProjectVariables,
  IQazinhoApi,
  IRepositoryList,
  IRepositoryRef,
  IResourceSnapshot,
  IRunEndNotice,
  IRunEvent,
  IRunInFlight,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
  ISetupEvent,
  IStartBuild,
  IStartRun,
  IViewport,
  InstallableId,
  IntegrationId,
  McpActionResult,
  McpSignInProgress,
  PickKind,
  Platform,
  SaveOutcome,
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
  saveVideo: (props: { name: string; data: Uint8Array }) =>
    ipcRenderer.invoke(CHANNELS.saveVideo, props) as Promise<SaveOutcome>,
  alertRunEnded: (notice: IRunEndNotice) => {
    ipcRenderer.send(CHANNELS.alertRunEnded, notice);
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
  readShot: (file: string) =>
    ipcRenderer.invoke(CHANNELS.readShot, file) as Promise<string | null>,
  saveShot: (props: { file: string | null; src: string | null; name: string }) =>
    ipcRenderer.invoke(CHANNELS.saveShot, props) as Promise<SaveOutcome>,
  pickFile: (kind: PickKind) =>
    ipcRenderer.invoke(CHANNELS.pickFile, kind) as Promise<string | null>,
  fitWindow: (fit: WindowFit) =>
    ipcRenderer.invoke(CHANNELS.fitWindow, fit) as Promise<void>,
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
  listRepositories: () =>
    ipcRenderer.invoke(CHANNELS.listRepositories) as Promise<IRepositoryList>,
  listBranches: (repository: IRepositoryRef) =>
    ipcRenderer.invoke(CHANNELS.listBranches, repository) as Promise<IBranchList>,
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
