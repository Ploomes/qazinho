import type { ISetupEvent } from '@/shared/types';

export interface ISetupInstaller {
  onEvent: (event: ISetupEvent) => void;
  directories: () => Promise<string[]>;
}
