import type {
  IDetectedAgent,
  IDeviceTools,
  IGocrashApi,
  IResourceSnapshot,
  Platform,
} from '@/types';
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/ipc';

const api: IGocrashApi = {
  platform: process.platform as Platform,
  detectAgents: () =>
    ipcRenderer.invoke(CHANNELS.detectAgents) as Promise<IDetectedAgent[]>,
  readResources: () =>
    ipcRenderer.invoke(CHANNELS.readResources) as Promise<IResourceSnapshot>,
  detectDeviceTools: () =>
    ipcRenderer.invoke(CHANNELS.detectDeviceTools) as Promise<IDeviceTools>,
};

contextBridge.exposeInMainWorld('gocrash', api);
