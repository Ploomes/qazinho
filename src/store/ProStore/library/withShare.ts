import type { IProShare } from '@/shared/types';

/** The shares with one project's changed: replaced in place, added at the end, or taken out once it is no longer shared. */
export function withShare(props: { shares: IProShare[]; share: IProShare }): IProShare[] {
  const { shares, share } = props;
  const others = shares.filter(({ projectId }) => projectId !== share.projectId);

  if (share.orgSlug === null) return others;

  return shares.some(({ projectId }) => projectId === share.projectId)
    ? shares.map((kept) => (kept.projectId === share.projectId ? share : kept))
    : [...shares, share];
}
