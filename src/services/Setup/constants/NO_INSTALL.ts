import type { IInstallResult } from '@/shared/types';

export const NO_INSTALL: IInstallResult = {
  isInstalled: false,
  error: 'QAzinho is not talking to the machine. Restart the app.',
  command: '',
  isFix: false,
};
