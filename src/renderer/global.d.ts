import type { QaceoApi } from '@/shared/types';

declare global {
  interface Window {
    qaceo: QaceoApi;
  }
}

export {};
