import type { IGithubStatus } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { githubConnectionOf } from '@/main/classes/integrations/IntegrationVault/library';

const AT = '2026-10-20T09:00:00.000Z';
const SIGNED_IN: IGithubStatus = {
  cli: { isFound: true, path: '/opt/homebrew/bin/gh' },
  account: 'octoqa',
  missingScopes: [],
  failure: null,
};

describe('githubConnectionOf', () => {
  it('connects the account the GitHub CLI is signed in as', () => {
    expect(githubConnectionOf({ status: SIGNED_IN, at: AT })).toEqual({
      isConnected: true,
      status: { id: 'github', account: 'octoqa', site: null, connectedAt: AT },
    });
  });

  it('does NOT connect a login that cannot read repositories', () => {
    expect(
      githubConnectionOf({ status: { ...SIGNED_IN, missingScopes: ['repo'] }, at: AT }),
    ).toEqual({
      isConnected: false,
      failure: { reason: 'scopes', scopes: ['repo'] },
    });
  });

  it('says why when gh is missing, signed out or offline', () => {
    const without = { ...SIGNED_IN, account: null };

    expect(
      githubConnectionOf({ status: { ...without, failure: 'no-cli' }, at: AT }),
    ).toEqual({ isConnected: false, failure: { reason: 'github', failure: 'no-cli' } });
    expect(githubConnectionOf({ status: { ...without, failure: null }, at: AT })).toEqual(
      {
        isConnected: false,
        failure: { reason: 'github', failure: 'signed-out' },
      },
    );
    expect(
      githubConnectionOf({ status: { ...without, failure: 'unreachable' }, at: AT }),
    ).toEqual({
      isConnected: false,
      failure: { reason: 'github', failure: 'unreachable' },
    });
  });
});
