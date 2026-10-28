import type { InstallFailure } from './InstallFailure';

/**
 * Como uma instalação terminou. Uma falha leva o porquê, e o que o QA pode rodar sozinho:
 * o conserto que ela sugeriu, ou a instalação.
 */
export type IInstallResult =
  | { isInstalled: true }
  | { isInstalled: false; failure: InstallFailure; command: string; isFix: boolean };
