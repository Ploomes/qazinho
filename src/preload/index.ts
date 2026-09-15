import type { GocrashApi } from '@/shared/types';
import { contextBridge } from 'electron';

const api: GocrashApi = {
  platform: process.platform,
};

contextBridge.exposeInMainWorld('gocrash', api);
