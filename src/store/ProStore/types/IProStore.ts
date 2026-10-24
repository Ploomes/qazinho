import type { IProShare, ProStatus } from '@/shared/types';

/** Where this machine stands with QAzinho Pro, null until it is read, and each project it shares with an org. */
export interface IProStore {
  status: ProStatus | null;
  shares: IProShare[];
  setStatus: (status: ProStatus) => void;
  setShares: (shares: IProShare[]) => void;
  landShare: (share: IProShare) => void;
}
