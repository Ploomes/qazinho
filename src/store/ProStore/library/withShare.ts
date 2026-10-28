import type { IProShare } from '@/shared/types';

/**
 * Os compartilhamentos com os de um projeto mudados: substituídos no lugar, acrescentados
 * no fim, ou tirados quando ele não é mais compartilhado.
 */
export function withShare(props: { shares: IProShare[]; share: IProShare }): IProShare[] {
  const { shares, share } = props;
  const others = shares.filter(({ projectId }) => projectId !== share.projectId);

  if (share.orgSlug === null) return others;

  return shares.some(({ projectId }) => projectId === share.projectId)
    ? shares.map((kept) => (kept.projectId === share.projectId ? share : kept))
    : [...shares, share];
}
