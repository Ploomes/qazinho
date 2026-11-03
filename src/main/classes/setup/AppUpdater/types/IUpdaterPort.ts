import type { IUpdaterListener } from './IUpdaterListener';

/** O atualizador do sistema como o `AppUpdater` o usa, sem saber qual é. */
export interface IUpdaterPort {
  listen: (listener: IUpdaterListener) => void;
  check: () => Promise<void>;
  install: () => void;
}
