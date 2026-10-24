import type { IProShare, ProStatus } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { attentionOf } from '@/modules/Pro/library';

const SIGNED_IN: ProStatus = {
  isSignedIn: true,
  account: { email: 'ana@loja.dev', name: 'Ana' },
  machine: { id: 'm1', name: 'MacBook-Ana' },
  orgs: [{ slug: 'loja', name: 'Loja', role: 'editor', billingStatus: 'active' }],
  orgSlug: 'loja',
  isReachable: true,
};

function shareOf(state: IProShare['state'], orgSlug = 'loja'): IProShare {
  return { projectId: `p-${state}`, orgSlug, state, syncedAt: null, conflicts: [] };
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

  it('names an account with no org, and one that only reads', () => {
    expect(
      attentionOf({ status: { ...SIGNED_IN, orgs: [], orgSlug: null }, shares: [] }),
    ).toBe('no-org');
    expect(attentionOf({ status: { ...SIGNED_IN, orgSlug: null }, shares: [] })).toBe(
      'reader',
    );
  });

  it('names the gravest refusal of the org it sends to', () => {
    expect(
      attentionOf({ status: SIGNED_IN, shares: [shareOf('failed'), shareOf('blocked')] }),
    ).toBe('blocked');
    expect(attentionOf({ status: SIGNED_IN, shares: [shareOf('read-only')] })).toBe(
      'read-only',
    );
  });

  it('does NOT count what another org refused before this computer moved', () => {
    expect(
      attentionOf({ status: SIGNED_IN, shares: [shareOf('blocked', 'outra')] }),
    ).toBeNull();
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
