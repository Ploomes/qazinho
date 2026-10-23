import type { IVaultCipher } from '@/main/types';
import type { IGithubStatus } from '@/shared/types';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IntegrationVault } from '@/main/classes/integrations/IntegrationVault';
import { fakeTracker } from '@/main/classes/integrations/IntegrationVault/library/__tests__/fixtures';

/** Reverses the text, so a test can tell a sealed file from a plain one. */
function fakeCipher(isAvailable = true): IVaultCipher {
  return {
    isAvailable: () => isAvailable,
    encrypt: (plain) => Buffer.from([...plain].reverse().join('')),
    decrypt: (sealed) => [...sealed.toString()].reverse().join(''),
  };
}

/** The GitHub CLI as the vault asks after it: signed in as octoqa unless told otherwise. */
function fakeGithub(status: Partial<IGithubStatus> = {}): () => Promise<IGithubStatus> {
  return () =>
    Promise.resolve({
      cli: { isFound: true, path: '/opt/homebrew/bin/gh' },
      account: 'octoqa',
      missingScopes: [],
      failure: null,
      ...status,
    });
}

async function vaultWith(props: {
  cipher?: IVaultCipher;
  github?: () => Promise<IGithubStatus>;
}) {
  const file = join(await mkdtemp(join(tmpdir(), 'qazinho-vault-')), 'integrations.bin');
  const { fetcher } = fakeTracker({
    status: 200,
    body: { displayName: 'Ana QA', emailAddress: 'ana@acme.test' },
  });

  return {
    file,
    vault: new IntegrationVault({
      file,
      cipher: props.cipher ?? fakeCipher(),
      fetcher,
      github: props.github ?? fakeGithub(),
    }),
  };
}

const JIRA = {
  id: 'jira' as const,
  site: 'acme.atlassian.net',
  email: 'ana@acme.test',
  token: 'jira_secret',
};

describe('IntegrationVault', () => {
  it('keeps a connection across a restart, without the token in the clear', async () => {
    const { file, vault } = await vaultWith({});

    await vault.connect(JIRA);

    const reopened = new IntegrationVault({
      file,
      cipher: fakeCipher(),
      fetcher: fakeTracker('offline').fetcher,
      github: fakeGithub(),
    });

    expect(await reopened.list()).toMatchObject([{ id: 'jira', account: 'Ana QA' }]);
    expect((await readFile(file)).toString()).not.toContain('jira_secret');
  });

  it('never hands the page a token', async () => {
    const { vault } = await vaultWith({});

    await vault.connect(JIRA);

    expect(JSON.stringify(await vault.list())).not.toContain('jira_secret');
  });

  it('connects GitHub as the account the GitHub CLI is signed in as, and keeps no token for it', async () => {
    const { file, vault } = await vaultWith({});

    expect(await vault.connect({ id: 'github' })).toMatchObject({
      isConnected: true,
      status: { id: 'github', account: 'octoqa' },
    });
    expect(await vault.list()).toMatchObject([{ id: 'github', account: 'octoqa' }]);
    expect([...(await readFile(file)).toString()].reverse().join('')).not.toContain(
      'token',
    );
  });

  it('does NOT connect GitHub while the GitHub CLI is signed out', async () => {
    const { vault } = await vaultWith({
      github: fakeGithub({ account: null, failure: 'signed-out' }),
    });

    expect(await vault.connect({ id: 'github' })).toEqual({
      isConnected: false,
      failure: { reason: 'github', failure: 'signed-out' },
    });
    expect(await vault.list()).toEqual([]);
  });

  it('forgets GitHub connected with a pasted token before gh', async () => {
    const { file, vault } = await vaultWith({});
    const legacy = [
      {
        status: {
          id: 'github',
          account: 'octoqa',
          site: null,
          connectedAt: '2026-10-01T09:00:00.000Z',
        },
        credentials: { id: 'github', token: 'ghp_old' },
      },
    ];

    await writeFile(file, fakeCipher().encrypt(JSON.stringify(legacy)));

    expect(await vault.list()).toEqual([]);
  });

  it('replaces a tracker connected twice instead of keeping both', async () => {
    const { vault } = await vaultWith({});

    await vault.connect({ id: 'github' });
    await vault.connect({ id: 'github' });

    expect(await vault.list()).toHaveLength(1);
  });

  it('forgets a tracker on disconnect', async () => {
    const { vault } = await vaultWith({});

    await vault.connect({ id: 'github' });
    await vault.disconnect('github');

    expect(await vault.list()).toEqual([]);
  });

  it('does NOT store anything when the machine has no keychain to seal it', async () => {
    const { vault } = await vaultWith({ cipher: fakeCipher(false) });

    expect(await vault.connect(JIRA)).toEqual({
      isConnected: false,
      failure: { reason: 'no-keychain' },
    });
    expect(await vault.list()).toEqual([]);
  });

  it('has nothing connected before anything was', async () => {
    const { vault } = await vaultWith({});

    expect(await vault.list()).toEqual([]);
  });

  describe('jira', () => {
    it('hands main the site and the credentials sealed for it', async () => {
      const { vault } = await vaultWith({});

      await vault.connect({ ...JIRA, email: ' ana@acme.test ', token: ' jira_secret ' });

      expect(await vault.jira()).toEqual({
        site: 'https://acme.atlassian.net',
        email: 'ana@acme.test',
        token: 'jira_secret',
      });
    });

    it('has nothing to hand over while Jira is not connected', async () => {
      const { vault } = await vaultWith({});

      await vault.connect({ id: 'github' });

      expect(await vault.jira()).toBeNull();
    });
  });

  describe('Confluence beside Jira', () => {
    it('is off until the QA turns it on, and hands Confluence the Jira credentials only then', async () => {
      const { vault } = await vaultWith({});

      await vault.connect(JIRA);

      expect(await vault.confluence()).toBeNull();
      expect(await vault.setConfluence(true)).toMatchObject({
        id: 'jira',
        confluence: true,
      });
      expect(await vault.confluence()).toEqual({
        site: 'https://acme.atlassian.net',
        email: 'ana@acme.test',
        token: 'jira_secret',
      });
      expect(await vault.list()).toMatchObject([{ id: 'jira', confluence: true }]);

      await vault.setConfluence(false);

      expect(await vault.confluence()).toBeNull();
    });

    it('stays on when Jira is connected again', async () => {
      const { vault } = await vaultWith({});

      await vault.connect(JIRA);
      await vault.setConfluence(true);
      await vault.connect(JIRA);

      expect(await vault.confluence()).not.toBeNull();
    });

    it('cannot be turned on with no Jira, and goes with Jira on disconnect', async () => {
      const { vault } = await vaultWith({});

      expect(await vault.setConfluence(true)).toBeNull();

      await vault.connect(JIRA);
      await vault.setConfluence(true);
      await vault.disconnect('jira');

      expect(await vault.confluence()).toBeNull();
    });
  });
});
