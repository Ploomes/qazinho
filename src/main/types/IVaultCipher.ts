/**
 * O que um cofre precisa do keychain do SO: o safeStorage do Electron no app, um fake num
 * teste.
 */
export interface IVaultCipher {
  isAvailable: () => boolean;
  encrypt: (plain: string) => Buffer;
  decrypt: (sealed: Buffer) => string;
}
