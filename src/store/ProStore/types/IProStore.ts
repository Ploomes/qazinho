import type { IProLink, IProShare, ProStatus, RunMode } from '@/shared/types';

/**
 * The QA's account, each project's link to its org, the plans being joined, and a run
 * held until the QA updates its plan.
 */
export interface IProStore {
  status: ProStatus | null;
  shares: IProShare[];
  link: IProLink | null;
  merging: string | null;
  heldRun: { workspaceId: string; mode: RunMode } | null;
  setStatus: (status: ProStatus) => void;
  setShares: (shares: IProShare[]) => void;
  landShare: (share: IProShare) => void;
  setLink: (link: IProLink | null) => void;
  openMerge: (projectId: string | null) => void;
  holdRun: (held: { workspaceId: string; mode: RunMode } | null) => void;
}
