import type { ProAttention } from '@/modules/Pro/types';
import type { IProShare, ProStatus } from '@/shared/types';

const BY_STATE: Partial<Record<IProShare['state'], ProAttention>> = {
  blocked: 'blocked',
  'read-only': 'read-only',
  'signed-out': 'signed-out',
  gone: 'gone',
  'no-access': 'no-access',
  failed: 'failed',
};

const GRAVEST_FIRST = [
  'blocked',
  'read-only',
  'signed-out',
  'gone',
  'no-access',
  'failed',
] as const satisfies readonly ProAttention[];

/**
 * A única coisa que o QA deve saber dos projetos ligados deste computador, a mais grave
 * primeiro; null enquanto tudo vai como deve.
 */
export function attentionOf(props: {
  status: ProStatus | null;
  shares: IProShare[];
}): ProAttention | null {
  const { status, shares } = props;

  if (status?.isSignedIn !== true) return null;
  if (status.orgs.length === 0) return 'no-org';
  if (status.orgs.every(({ role }) => role === 'reader')) return 'reader';

  const seen = new Set(
    shares.flatMap(({ state }) =>
      BY_STATE[state] === undefined ? [] : [BY_STATE[state]],
    ),
  );
  const gravest = GRAVEST_FIRST.find((one) => seen.has(one));

  return gravest ?? (status.isReachable ? null : 'unreachable');
}
