import type { GocrashApi } from '@/shared/types';

declare global {
  interface Window {
    gocrash: GocrashApi;
  }
}

export {};
