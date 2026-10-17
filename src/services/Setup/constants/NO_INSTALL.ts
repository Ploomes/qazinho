import type { IInstallResult } from '@/types';

/** A page with no bridge installs nothing, and says why. */
export const NO_INSTALL: IInstallResult = {
  isInstalled: false,
  error: 'QAzinho is not talking to the machine. Restart the app.',
  command: '',
};
