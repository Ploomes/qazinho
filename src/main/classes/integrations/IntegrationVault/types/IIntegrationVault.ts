import type { Fetcher } from './Fetcher';
import type { IVaultCipher } from '@/main/types';
import type { IGithubStatus } from '@/shared/types';

export interface IIntegrationVault {
  file: string;
  cipher: IVaultCipher;
  fetcher: Fetcher;
  github: () => Promise<IGithubStatus>;
}
