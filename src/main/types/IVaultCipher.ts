/** What a vault needs from the OS keychain: Electron's safeStorage in the app, a fake in a test. */
export interface IVaultCipher {
  isAvailable: () => boolean;
  encrypt: (plain: string) => Buffer;
  decrypt: (sealed: Buffer) => string;
}
