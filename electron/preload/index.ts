import type {
  IAgentEvent,
  IAgentTurn,
  IAskAgent,
  IConnectIntegration,
  IConnectResult,
  IDetectedAgent,
  IDeviceTools,
  IQazinhoApi,
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  InstallableId,
  IntegrationId,
  IResourceSnapshot,
  IRunEvent,
  ISavedState,
  ISavedWorkspace,
  ISetupEvent,
  IStartRun,
  PickKind,
  Platform,
} from '@/types';
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/constants';

const api: IQazinhoApi = {
  platform: process.platform as Platform,
  detectAgents: () =>
    ipcRenderer.invoke(CHANNELS.detectAgents) as Promise<IDetectedAgent[]>,
  readResources: () =>
    ipcRenderer.invoke(CHANNELS.readResources) as Promise<IResourceSnapshot>,
  detectDeviceTools: () =>
    ipcRenderer.invoke(CHANNELS.detectDeviceTools) as Promise<IDeviceTools>,
  askAgent: (ask: IAskAgent) =>
    ipcRenderer.invoke(CHANNELS.askAgent, ask) as Promise<IAgentTurn>,
  onAgentEvent: (listener: (event: IAgentEvent) => void) => {
    const forward = (_: unknown, event: IAgentEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.agentEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.agentEvent, forward);
    };
  },
  startRun: (run: IStartRun) =>
    ipcRenderer.invoke(CHANNELS.startRun, run) as Promise<void>,
  pauseRun: (props: { workspaceId: string; isPaused: boolean }) =>
    ipcRenderer.invoke(CHANNELS.pauseRun, props) as Promise<void>,
  stopRun: (workspaceId: string) =>
    ipcRenderer.invoke(CHANNELS.stopRun, workspaceId) as Promise<void>,
  onRunEvent: (listener: (event: IRunEvent) => void) => {
    const forward = (_: unknown, event: IRunEvent) => {
      listener(event);
    };

    ipcRenderer.on(CHANNELS.runEvent, forward);

    return () => {
      ipcRenderer.off(CHANNELS.runEvent, forward);
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
  pickFile: (kind: PickKind) =>
    ipcRenderer.invoke(CHANNELS.pickFile, kind) as Promise<string | null>,
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
};

contextBridge.exposeInMainWorld('qazinho', api);
