import type { IQazinhoApi, IRecorderApi } from '@/shared/types';

declare global {
  interface Window {
    qazinho: IQazinhoApi;
    qazinhoRecorder: IRecorderApi;
  }

  const __QAZINHO_VERSION__: string;
}

export {};
