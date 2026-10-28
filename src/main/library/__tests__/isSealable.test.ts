import { describe, expect, it } from 'vitest';
import { isSealable } from '@/main/library';

describe('isSealable', () => {
  it('seals with the keychain of a Mac and the DPAPI of Windows', () => {
    expect(isSealable({ platform: 'darwin', isAvailable: true, store: null })).toBe(true);
    expect(isSealable({ platform: 'win32', isAvailable: true, store: null })).toBe(true);
  });

  it('seals on Linux with GNOME Keyring or KWallet behind it', () => {
    for (const store of ['gnome_libsecret', 'kwallet', 'kwallet5', 'kwallet6'])
      expect(isSealable({ platform: 'linux', isAvailable: true, store })).toBe(true);
  });

  /**
   * Sem armazenamento de segredos, o Electron ainda diz sim e lacra com uma chave escrita
   * no próprio Electron.
   */
  it('does NOT seal on Linux when Electron would fall back to its fixed key', () => {
    for (const store of ['basic_text', 'unknown', null])
      expect(isSealable({ platform: 'linux', isAvailable: true, store })).toBe(false);
  });

  it('does NOT seal anywhere the OS says it cannot', () => {
    expect(isSealable({ platform: 'darwin', isAvailable: false, store: null })).toBe(
      false,
    );
    expect(isSealable({ platform: 'linux', isAvailable: false, store: 'kwallet5' })).toBe(
      false,
    );
  });
});
