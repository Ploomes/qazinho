import type { IIslandApi, IQazinhoApi, IRecorderApi } from '@/shared/types';

declare global {
  interface Window {
    qazinho: IQazinhoApi;
    qazinhoRecorder: IRecorderApi;
    qazinhoIsland: IIslandApi;
  }

  const __QAZINHO_VERSION__: string;
}

export {};
