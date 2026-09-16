import type {
  IAgentEvent,
  IAgentTurn,
  IAskAgent,
  IDetectedAgent,
  IDeviceTools,
  IGocrashApi,
  IResourceSnapshot,
  IRunEvent,
  IStartRun,
  Platform,
} from '@/types';
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/constants';

const api: IGocrashApi = {
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
};

contextBridge.exposeInMainWorld('gocrash', api);
