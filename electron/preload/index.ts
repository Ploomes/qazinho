import type {
  AgentSignInProgress,
  GithubSignInProgress,
  IAgentEvent,
  IChatTurn,
  IAskAgent,
  IConnectIntegration,
  IGithubStatus,
  IConnectResult,
  IDetectedAgent,
  IDeviceTools,
  IQazinhoApi,
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  IMcpServerStatus,
  McpActionResult,
  IMcpServerTarget,
  IMcpSignIn,
  McpSignInProgress,
  InstallableId,
  IntegrationId,
  IResourceSnapshot,
  IRunEvent,
  IRunInFlight,
  IRunEndNotice,
  IRunRef,
  ISavedState,
  ISavedWorkspace,
  ISetupEvent,
  IStartRun,
  IViewport,
  PickKind,
  Platform,
  SaveOutcome,
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
};

if (process.argv.includes(RECORDER_ARGUMENT))
  contextBridge.exposeInMainWorld('qazinhoRecorder', recorderApi);
else contextBridge.exposeInMainWorld('qazinho', api);
