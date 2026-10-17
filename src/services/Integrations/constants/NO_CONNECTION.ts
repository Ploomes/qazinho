import type { IConnectResult } from '@/types';

/** A page with no bridge connects nothing, and says why. */
export const NO_CONNECTION: IConnectResult = {
  isConnected: false,
  error: 'QAzinho is not talking to the machine. Restart the app.',
};
