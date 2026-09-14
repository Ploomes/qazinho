import type { QaceoApi } from '@/shared/types';
import { contextBridge } from 'electron';

const api: QaceoApi = {
  platform: process.platform,
};

contextBridge.exposeInMainWorld('qaceo', api);
