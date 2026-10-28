import type { ProApi } from '@/main/classes/pro/ProApi';
import type { IVaultCipher } from '@/main/types';
import type { ProSignInProgress } from '@/shared/types';

/**
 * O que fazer esta máquina entrar precisa: a plataforma, o keychain, onde vai o arquivo
 * lacrado, o navegador, e um relógio que um teste pode conduzir.
 */
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
