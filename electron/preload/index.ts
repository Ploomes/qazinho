import type {
  IAgentEvent,
  IAgentTurn,
  IAskAgent,
  IDetectedAgent,
  IDeviceTools,
  IGocrashApi,
  IResourceSnapshot,
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
};

contextBridge.exposeInMainWorld('gocrash', api);
