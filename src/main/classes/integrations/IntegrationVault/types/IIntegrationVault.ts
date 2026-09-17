import type { Fetcher } from './Fetcher';
import type { IVaultCipher } from './IVaultCipher';

export interface IIntegrationVault {
  file: string;
  cipher: IVaultCipher;
  fetcher: Fetcher;
}
