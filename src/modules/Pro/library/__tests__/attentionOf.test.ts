import type { IProShare, ProStatus } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { attentionOf } from '@/modules/Pro/library';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [{ slug: 'loja', name: 'Loja', role: 'editor', billingStatus: 'active' }],
  isReachable: true,
};

function shareOf(state: IProShare['state'], orgSlug = 'loja'): IProShare {
  return {
    projectId: `p-${state}`,
    orgSlug,
    state,
    syncedAt: null,
    pending: [],
    conflicts: [],
  };
}

describe('attentionOf', () => {
  it('says nothing while all goes as it should, or while signed out', () => {
    expect(
      attentionOf({ status: SIGNED_IN, shares: [shareOf('synced'), shareOf('sending')] }),
    ).toBeNull();
    expect(
      attentionOf({ status: { isSignedIn: false, canKeepToken: true }, shares: [] }),
    ).toBeNull();
    expect(attentionOf({ status: null, shares: [] })).toBeNull();
  });

  it('names an account with no org, and one that only reads in every org', () => {
    expect(attentionOf({ status: { ...SIGNED_IN, orgs: [] }, shares: [] })).toBe(
      'no-org',
    );
    expect(
      attentionOf({
        status: {
          ...SIGNED_IN,
          orgs: SIGNED_IN.orgs.map((org) => ({ ...org, role: 'reader' as const })),
        },
        shares: [],
      }),
    ).toBe('reader');
  });

  it('does NOT call reader an account that writes in one of its orgs', () => {
    expect(
      attentionOf({
        status: {
          ...SIGNED_IN,
          orgs: [
            ...SIGNED_IN.orgs,
            { slug: 'outra', name: 'Outra', role: 'reader', billingStatus: 'active' },
          ],
        },
        shares: [],
      }),
    ).toBeNull();
  });

  it('names the gravest refusal across every org a project is linked to', () => {
    expect(
      attentionOf({
        status: SIGNED_IN,
        shares: [shareOf('failed'), shareOf('blocked', 'outra')],
      }),
    ).toBe('blocked');
    expect(attentionOf({ status: SIGNED_IN, shares: [shareOf('read-only')] })).toBe(
      'read-only',
    );
  });

  it('names a project the org deleted, and an org out of reach, above a failure', () => {
    expect(
      attentionOf({ status: SIGNED_IN, shares: [shareOf('failed'), shareOf('gone')] }),
    ).toBe('gone');
    expect(
      attentionOf({
        status: SIGNED_IN,
        shares: [shareOf('failed'), shareOf('no-access')],
      }),
    ).toBe('no-access');
  });

  it('says the platform did not answer, below any refusal', () => {
    expect(
      attentionOf({ status: { ...SIGNED_IN, isReachable: false }, shares: [] }),
    ).toBe('unreachable');
    expect(
      attentionOf({
        status: { ...SIGNED_IN, isReachable: false },
        shares: [shareOf('failed')],
      }),
    ).toBe('failed');
  });
});
