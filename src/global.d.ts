import type { IQazinhoApi } from '@/shared/types';

declare global {
  interface Window {
    qazinho: IQazinhoApi;
  }

  const __QAZINHO_VERSION__: string;
}

export {};
