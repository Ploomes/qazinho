import type { IGocrashApi, Platform } from '@/types';
import { contextBridge } from 'electron';

const api: IGocrashApi = {
  platform: process.platform as Platform,
};

contextBridge.exposeInMainWorld('gocrash', api);
