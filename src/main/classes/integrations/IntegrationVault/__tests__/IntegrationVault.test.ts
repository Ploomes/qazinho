import type { IVaultCipher } from '@/main/classes/integrations/IntegrationVault/types';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IntegrationVault } from '@/main/classes/integrations/IntegrationVault';
import { TRACKER_ERRORS } from '@/main/classes/integrations/IntegrationVault/constants';
import { fakeTracker } from '@/main/classes/integrations/IntegrationVault/library/__tests__/fixtures';

/** Reverses the text, so a test can tell a sealed file from a plain one. */
function fakeCipher(isAvailable = true): IVaultCipher {
  return {
    isAvailable: () => isAvailable,
    encrypt: (plain) => Buffer.from([...plain].reverse().join('')),
    decrypt: (sealed) => [...sealed.toString()].reverse().join(''),
  };
}

async function vaultWith(props: { cipher?: IVaultCipher; body?: unknown }) {
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-vault-')), 'integrations.bin');
  const { fetcher } = fakeTracker({
    status: 200,
    body: props.body ?? { login: 'octoqa' },
  });

  return {
    file,
    vault: new IntegrationVault({ file, cipher: props.cipher ?? fakeCipher(), fetcher }),
  };
}

describe('IntegrationVault', () => {
  it('keeps a connection across a restart, without the token in the clear', async () => {
    const { file, vault } = await vaultWith({});

    await vault.connect({ id: 'github', token: 'ghp_secret' });

    const reopened = new IntegrationVault({
      file,
      cipher: fakeCipher(),
      fetcher: fakeTracker('offline').fetcher,
    });

    expect(await reopened.list()).toMatchObject([{ id: 'github', account: 'octoqa' }]);
    expect((await readFile(file)).toString()).not.toContain('ghp_secret');
  });

  it('never hands the page a token', async () => {
    const { vault } = await vaultWith({});

    await vault.connect({ id: 'github', token: 'ghp_secret' });

    expect(JSON.stringify(await vault.list())).not.toContain('ghp_secret');
  });

  it('replaces a tracker connected twice instead of keeping both', async () => {
    const { vault } = await vaultWith({});

    await vault.connect({ id: 'github', token: 'one' });
    await vault.connect({ id: 'github', token: 'two' });

    expect(await vault.list()).toHaveLength(1);
  });

  it('forgets a tracker on disconnect', async () => {
    const { vault } = await vaultWith({});

    await vault.connect({ id: 'github', token: 'x' });
    await vault.disconnect('github');

    expect(await vault.list()).toEqual([]);
  });

  it('does NOT store a token when the machine has no keychain to seal it', async () => {
    const { vault } = await vaultWith({ cipher: fakeCipher(false) });

    expect(await vault.connect({ id: 'github', token: 'x' })).toEqual({
      isConnected: false,
      error: TRACKER_ERRORS.noKeychain,
    });
    expect(await vault.list()).toEqual([]);
  });

  it('has nothing connected before anything was', async () => {
    const { vault } = await vaultWith({});

    expect(await vault.list()).toEqual([]);
  });
});
