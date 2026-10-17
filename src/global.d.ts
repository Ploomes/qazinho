import type { IQazinhoApi } from '@/types';

declare global {
  interface Window {
    qazinho: IQazinhoApi;
  }
}

export {};
