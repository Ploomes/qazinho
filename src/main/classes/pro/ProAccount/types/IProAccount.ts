import type { ProApi } from '@/main/classes/pro/ProApi';
import type { IVaultCipher } from '@/main/types';
import type { ProSignInProgress } from '@/shared/types';

/** What signing this machine in needs: the platform, the keychain, where the sealed file goes, the browser, and a clock a test can drive. */
export interface IProAccount {
  api: Pick<ProApi, 'deviceCode' | 'deviceToken' | 'me' | 'revokeMachine'>;
  cipher: IVaultCipher;
  file: string;
  machineName: string;
  openUrl: (url: string) => Promise<void>;
  wait: (ms: number) => Promise<void>;
  now: () => number;
  onProgress: (progress: ProSignInProgress) => void;
}
