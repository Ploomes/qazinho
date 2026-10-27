import type { ProAttention } from '@/modules/Pro/types';
import type { IProShare, ProStatus } from '@/shared/types';

const BY_STATE: Partial<Record<IProShare['state'], ProAttention>> = {
  blocked: 'blocked',
  'read-only': 'read-only',
  'signed-out': 'signed-out',
  failed: 'failed',
};

/**
 * The one thing the QA should know about this computer's sending, the gravest first; null
 * while all goes as it should.
 */
export function attentionOf(props: {
  status: ProStatus | null;
  shares: IProShare[];
}): ProAttention | null {
  const { status, shares } = props;

  if (status?.isSignedIn !== true) return null;
  if (status.orgs.length === 0) return 'no-org';
  if (status.orgSlug === null) return 'reader';

  const seen = new Set(
    shares
      .filter(({ orgSlug }) => orgSlug === status.orgSlug)
      .flatMap(({ state }) => (BY_STATE[state] === undefined ? [] : [BY_STATE[state]])),
  );
  const gravest = (['blocked', 'read-only', 'signed-out', 'failed'] as const).find(
    (one) => seen.has(one),
  );

  return gravest ?? (status.isReachable ? null : 'unreachable');
}
