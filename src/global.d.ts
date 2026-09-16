import type { IGocrashApi } from '@/types';

declare global {
  interface Window {
    gocrash: IGocrashApi;
  }
}

export {};
