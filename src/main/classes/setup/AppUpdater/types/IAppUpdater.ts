import type { IUpdaterPort } from './IUpdaterPort';
import type { AppUpdate } from '@/shared/types';

/** O atualizador, se este app consegue se atualizar, e quem ouve o que acontece. */
export interface IAppUpdater {
  port: IUpdaterPort;
  isAvailable: boolean;
  isStore: boolean;
  onChange: (update: AppUpdate) => void;
  log: (message: string) => void;
}
