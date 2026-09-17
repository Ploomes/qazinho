import type { ISetupEvent } from '@/types';

export interface ISetupInstaller {
  onEvent: (event: ISetupEvent) => void;
  directories: () => Promise<string[]>;
}
