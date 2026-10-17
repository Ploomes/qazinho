import type { IConnectResult } from '@/shared/types';

export const NO_CONNECTION: IConnectResult = {
  isConnected: false,
  error: 'QAzinho is not talking to the machine. Restart the app.',
};
