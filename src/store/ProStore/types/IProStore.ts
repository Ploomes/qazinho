import type { IProLink, IProShare, ProStatus, RunMode } from '@/shared/types';

/**
 * A conta do QA, o vínculo de cada projeto com a org dele, os planos sendo juntados, e
 * uma run segurada até o QA atualizar o plano dela.
 */
export interface IProStore {
  status: ProStatus | null;
  shares: IProShare[];
  link: IProLink | null;
  merging: string | null;
  heldRun: { workspaceId: string; mode: RunMode; caseIds?: string[] } | null;
  setStatus: (status: ProStatus) => void;
  setShares: (shares: IProShare[]) => void;
  landShare: (share: IProShare) => void;
  setLink: (link: IProLink | null) => void;
  openMerge: (projectId: string | null) => void;
  holdRun: (
    held: { workspaceId: string; mode: RunMode; caseIds?: string[] } | null,
  ) => void;
}
