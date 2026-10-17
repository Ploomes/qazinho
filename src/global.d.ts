import type { IQazinhoApi } from '@/shared/types';

declare global {
  interface Window {
    qazinho: IQazinhoApi;
  }
}

export {};
